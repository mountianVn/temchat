const { initializeDatabase, run, get, all, exec } = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');

async function doSeed() {
  console.log('Starting database seed...');

  // Delete existing database to avoid conflicts
  const fs = require('fs');
  // db.js puts the database at server/database/chat.db
  const dbFile = path.join(__dirname, '..', '..', 'database', 'chat.db');
  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
  }

  await initializeDatabase();

  const password = bcrypt.hashSync('password123', 10);

  const users = [
    { username: 'alice', display_name: 'Alice Johnson', avatar: '/avatars/alice.png', role: 'Team Lead', department: 'Engineering', bio: 'Full-stack developer with 8 years of experience. Love clean code and good coffee.', status: 'online' },
    { username: 'bob', display_name: 'Bob Chen', avatar: '/avatars/bob.png', role: 'Backend Developer', department: 'Engineering', bio: 'Node.js enthusiast. Building scalable APIs.', status: 'online' },
    { username: 'carol', display_name: 'Carol Williams', avatar: '/avatars/carol.png', role: 'Frontend Developer', department: 'Engineering', bio: 'React & TypeScript lover. Making interfaces beautiful.', status: 'away' },
    { username: 'david', display_name: 'David Kim', avatar: '/avatars/david.png', role: 'DevOps Engineer', department: 'Infrastructure', bio: 'Kubernetes, Docker, and all things cloud.', status: 'online' },
    { username: 'emma', display_name: 'Emma Martinez', avatar: '/avatars/emma.png', role: 'Product Manager', department: 'Product', bio: 'Turning ideas into features. Agile advocate.', status: 'busy' },
    { username: 'frank', display_name: 'Frank Thompson', avatar: '/avatars/frank.png', role: 'QA Engineer', department: 'Engineering', bio: 'Testing all the things. Bug hunter extraordinaire.', status: 'offline' },
    { username: 'grace', display_name: 'Grace Lee', avatar: '/avatars/grace.png', role: 'UX Designer', department: 'Design', bio: 'Design with empathy. Prototyping in Figma.', status: 'online' },
    { username: 'henry', display_name: 'Henry Patel', avatar: '/avatars/henry.png', role: 'Data Engineer', department: 'Data', bio: 'SQL, Python, and data pipelines. Making sense of data.', status: 'away' },
  ];

  const userIds = {};
  for (const user of users) {
    const result = run(
      'INSERT INTO users (username, password, display_name, avatar, role, department, bio, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user.username, password, user.display_name, user.avatar, user.role, user.department, user.bio, user.status]
    );
    userIds[user.username] = result.lastInsertRowid;
  }

  const conv1 = run('INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)', [userIds.alice, userIds.bob]);
  const conv2 = run('INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)', [userIds.alice, userIds.carol]);
  const conv3 = run('INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)', [userIds.bob, userIds.david]);
  const conv4 = run('INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)', [userIds.carol, userIds.grace]);

  const messages = [
    { conv: conv1.lastInsertRowid, sender: userIds.alice, text: 'Hey Bob, did you review the PR for the auth refactor?', time: '2026-05-26 08:30:00' },
    { conv: conv1.lastInsertRowid, sender: userIds.bob, text: 'Yes! Looks good. Just one small comment on the error handling.', time: '2026-05-26 08:32:00' },
    { conv: conv1.lastInsertRowid, sender: userIds.alice, text: 'Ah good catch. I will fix that today.', time: '2026-05-26 08:33:00' },
    { conv: conv1.lastInsertRowid, sender: userIds.bob, text: 'Also the new WebSocket implementation is solid', time: '2026-05-26 08:35:00' },
    { conv: conv2.lastInsertRowid, sender: userIds.carol, text: 'Grace, can you check the new dashboard design?', time: '2026-05-26 09:00:00' },
    { conv: conv2.lastInsertRowid, sender: userIds.alice, text: 'The colors look great! Can we make the buttons slightly larger?', time: '2026-05-26 09:15:00' },
    { conv: conv2.lastInsertRowid, sender: userIds.carol, text: 'Sure, will update in the next iteration.', time: '2026-05-26 09:17:00' },
    { conv: conv3.lastInsertRowid, sender: userIds.bob, text: 'David, the staging server is acting up again.', time: '2026-05-26 10:00:00' },
    { conv: conv3.lastInsertRowid, sender: userIds.david, text: 'Looking at it. Probably the memory limit issue we discussed.', time: '2026-05-26 10:02:00' },
    { conv: conv4.lastInsertRowid, sender: userIds.grace, text: 'New mockups are up in Figma!', time: '2026-05-26 11:00:00' },
    { conv: conv4.lastInsertRowid, sender: userIds.carol, text: 'Awesome! I will take a look after standup.', time: '2026-05-26 11:05:00' },
  ];

  for (const msg of messages) {
    run('INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES (?, ?, ?, ?)', [msg.conv, msg.sender, msg.text, msg.time]);
  }

  const engineering = run('INSERT INTO groups (name, avatar, description, created_by) VALUES (?, ?, ?, ?)', ['Engineering Team', '/group-avatars/engineering.png', 'Main engineering team channel', userIds.alice]);
  const frontend = run('INSERT INTO groups (name, avatar, description, created_by) VALUES (?, ?, ?, ?)', ['Frontend Guild', '/group-avatars/frontend.png', 'Frontend developers discussion', userIds.carol]);
  const announcements = run('INSERT INTO groups (name, avatar, description, created_by) VALUES (?, ?, ?, ?)', ['Announcements', '/group-avatars/announcements.png', 'Company-wide announcements', userIds.emma]);
  const random = run('INSERT INTO groups (name, avatar, description, created_by) VALUES (?, ?, ?, ?)', ['Random', '/group-avatars/random.png', 'Non-work banter', userIds.alice]);

  const addMember = (groupId, username, role = 'member') => {
    run('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)', [groupId, userIds[username], role]);
  };

  addMember(engineering.lastInsertRowid, 'alice', 'admin');
  addMember(engineering.lastInsertRowid, 'bob', 'member');
  addMember(engineering.lastInsertRowid, 'carol', 'member');
  addMember(engineering.lastInsertRowid, 'david', 'member');
  addMember(engineering.lastInsertRowid, 'frank', 'member');

  addMember(frontend.lastInsertRowid, 'carol', 'admin');
  addMember(frontend.lastInsertRowid, 'alice', 'member');
  addMember(frontend.lastInsertRowid, 'grace', 'member');

  addMember(announcements.lastInsertRowid, 'emma', 'admin');
  addMember(announcements.lastInsertRowid, 'alice', 'member');
  addMember(announcements.lastInsertRowid, 'bob', 'member');
  addMember(announcements.lastInsertRowid, 'carol', 'member');
  addMember(announcements.lastInsertRowid, 'david', 'member');
  addMember(announcements.lastInsertRowid, 'frank', 'member');
  addMember(announcements.lastInsertRowid, 'grace', 'member');
  addMember(announcements.lastInsertRowid, 'henry', 'member');

  addMember(random.lastInsertRowid, 'alice', 'admin');
  addMember(random.lastInsertRowid, 'bob', 'member');
  addMember(random.lastInsertRowid, 'carol', 'member');
  addMember(random.lastInsertRowid, 'david', 'member');
  addMember(random.lastInsertRowid, 'emma', 'member');
  addMember(random.lastInsertRowid, 'frank', 'member');
  addMember(random.lastInsertRowid, 'grace', 'member');
  addMember(random.lastInsertRowid, 'henry', 'member');

  const groupMessages = [
    { group: engineering.lastInsertRowid, sender: userIds.alice, text: 'Daily standup in 10 minutes!', time: '2026-05-26 09:50:00' },
    { group: engineering.lastInsertRowid, sender: userIds.bob, text: 'On my way', time: '2026-05-26 09:51:00' },
    { group: engineering.lastInsertRowid, sender: userIds.david, text: 'I will join remotely today', time: '2026-05-26 09:52:00' },
    { group: frontend.lastInsertRowid, sender: userIds.carol, text: 'Just merged the new component library. Everyone please pull!', time: '2026-05-26 10:30:00' },
    { group: frontend.lastInsertRowid, sender: userIds.grace, text: 'Got it! The new Button component is exactly what we needed', time: '2026-05-26 10:32:00' },
    { group: announcements.lastInsertRowid, sender: userIds.emma, text: 'New release v2.5 deployed to production! Check the changelog in Notion.', time: '2026-05-26 08:00:00' },
    { group: random.lastInsertRowid, sender: userIds.bob, text: 'Anyone up for lunch at 12:30?', time: '2026-05-26 11:00:00' },
    { group: random.lastInsertRowid, sender: userIds.david, text: 'I am in! Thai place?', time: '2026-05-26 11:01:00' },
    { group: random.lastInsertRowid, sender: userIds.frank, text: 'Count me in too', time: '2026-05-26 11:03:00' },
  ];

  for (const msg of groupMessages) {
    run('INSERT INTO messages (group_id, sender_id, content, created_at) VALUES (?, ?, ?, ?)', [msg.group, msg.sender, msg.text, msg.time]);
  }

  run('INSERT INTO notifications (user_id, type, title, body, is_read) VALUES (?, ?, ?, ?, ?)', [userIds.bob, 'message', 'New message from Alice', 'Hey Bob, did you review the PR...', 0]);
  run('INSERT INTO notifications (user_id, type, title, body, is_read) VALUES (?, ?, ?, ?, ?)', [userIds.david, 'group_add', 'Added to Engineering Team', 'You have been added to Engineering Team', 1]);
  run('INSERT INTO notifications (user_id, type, title, body, is_read) VALUES (?, ?, ?, ?, ?)', [userIds.grace, 'mention', 'Carol mentioned you', 'Grace, can you check the new dashboard design?', 0]);

  console.log('Seed completed successfully!');
  console.log('Demo accounts (password: password123):');
  console.log('  alice, bob, carol, david, emma, frank, grace, henry');
}

if (require.main === module) {
  doSeed();
}

module.exports = { seed: doSeed };
