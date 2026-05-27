require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const { initializeDatabase } = require('./database/db');
const { setupSocket } = require('./socket/socketHandler');
const { sanitizeInput } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');
const notificationRoutes = require('./routes/notifications');

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  app.set('io', io);

  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(sanitizeInput);

  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  await initializeDatabase();

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  setupSocket(io);

  const PORT = process.env.PORT || 3001;
  const HOST = process.env.HOST || '0.0.0.0';
  server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`API: http://${HOST}:${PORT}/api`);
    console.log(`WebSocket: ws://${HOST}:${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
