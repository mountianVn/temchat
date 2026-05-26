const jwt = require('jsonwebtoken');
const { get, run } = require('../database/db');

function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${userId}`);

    socket.join(`user:${userId}`);
    run("UPDATE users SET status = ?, last_seen = datetime('now') WHERE id = ?", ['online', userId]);
    io.emit('user_status', { userId, status: 'online' });

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('join_group', (groupId) => {
      const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId]);
      if (member) socket.join(`group:${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('send_message', (data) => {
      try {
        const { content, conversation_id, group_id, file_url, file_type, file_name } = data;

        if (conversation_id) {
          const conv = get('SELECT * FROM conversations WHERE id = ?', [conversation_id]);
          if (!conv) return;
          if (conv.user1_id !== userId && conv.user2_id !== userId) return;
        }

        if (group_id) {
          const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [group_id, userId]);
          if (!member) return;
        }

        if (!content && !file_url) return;

        const result = run(
          `INSERT INTO messages (conversation_id, group_id, sender_id, content, file_url, file_type, file_name) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [conversation_id || null, group_id || null, userId, content || '', file_url || null, file_type || null, file_name || null]
        );

        const message = get(`
          SELECT m.*, u.username, u.display_name, u.avatar, u.role
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.id = ?
        `, [result.lastInsertRowid]);

        if (conversation_id) {
          socket.to(`conversation:${conversation_id}`).emit('new_message', message);
        }

        if (group_id) {
          socket.to(`group:${group_id}`).emit('new_message', message);

          const mentionedUsernames = content.match(/@(\w+)/g);
          if (mentionedUsernames) {
            const uniqueMentions = [...new Set(mentionedUsernames.map(m => m.slice(1)))];
            for (const username of uniqueMentions) {
              const mentionedUser = get('SELECT id FROM users WHERE username = ?', [username]);
              if (mentionedUser && mentionedUser.id !== userId) {
                run(
                  `INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'mention', ?, ?)`,
                  [mentionedUser.id, `${message.display_name} mentioned you`, (content || '').substring(0, 100)]
                );
                io.to(`user:${mentionedUser.id}`).emit('notification', {
                  type: 'mention',
                  title: `${message.display_name} mentioned you`,
                  body: (content || '').substring(0, 100),
                  messageId: message.id,
                });
              }
            }
          }
        }

        socket.emit('message_sent', message);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing_start', (data) => {
      const { conversation_id, group_id } = data;
      if (conversation_id) socket.to(`conversation:${conversation_id}`).emit('user_typing', { conversation_id, userId, typing: true });
      if (group_id) socket.to(`group:${group_id}`).emit('user_typing', { group_id, userId, typing: true });
    });

    socket.on('typing_stop', (data) => {
      const { conversation_id, group_id } = data;
      if (conversation_id) socket.to(`conversation:${conversation_id}`).emit('user_typing', { conversation_id, userId, typing: false });
      if (group_id) socket.to(`group:${group_id}`).emit('user_typing', { group_id, userId, typing: false });
    });

    socket.on('mark_read', (data) => {
      try {
        const { conversation_id, group_id } = data;

        if (conversation_id) {
          run(
            `UPDATE messages SET read_at = datetime('now') WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL`,
            [conversation_id, userId]
          );
          const conv = get('SELECT * FROM conversations WHERE id = ?', [conversation_id]);
          if (conv) {
            const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
            io.to(`user:${otherUserId}`).emit('message_read', { conversation_id, readBy: userId });
          }
        }

        if (group_id) {
          run(
            `UPDATE messages SET read_at = datetime('now') WHERE group_id = ? AND sender_id != ? AND read_at IS NULL`,
            [group_id, userId]
          );
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    socket.on('update_status', (data) => {
      try {
        const { status } = data;
        if (!['online', 'offline', 'away', 'busy'].includes(status)) return;
        run('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
        io.emit('user_status', { userId, status });
      } catch (error) {
        console.error('Status update error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      run("UPDATE users SET status = ?, last_seen = datetime('now') WHERE id = ?", ['offline', userId]);
      io.emit('user_status', { userId, status: 'offline' });
    });
  });
}

module.exports = { setupSocket };
