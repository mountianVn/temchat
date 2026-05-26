const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;
let SQL = null;

const dbDir = path.join(__dirname, '..', '..', 'database');
const dbPath = path.join(dbDir, 'chat.db');

async function initializeSqlJs() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

function getDb() {
  return db;
}

async function initializeDatabase() {
  await initializeSqlJs();

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      avatar TEXT DEFAULT '/default-avatar.png',
      role TEXT DEFAULT 'Developer',
      department TEXT DEFAULT 'Engineering',
      bio TEXT DEFAULT '',
      status TEXT DEFAULT 'offline',
      last_seen TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user1_id, user2_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      group_id INTEGER,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      file_url TEXT,
      file_type TEXT,
      file_name TEXT,
      is_pinned INTEGER DEFAULT 0,
      read_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '/group-default.png',
      description TEXT DEFAULT '',
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TEXT DEFAULT (datetime('now')),
      UNIQUE(group_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pinned_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      pinned_by INTEGER NOT NULL,
      pinned_at TEXT DEFAULT (datetime('now')),
      UNIQUE(message_id, group_id)
    )
  `);

  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log('Database initialized successfully');
}

function saveDb() {
  if (db) {
    fs.writeFileSync(dbPath, Buffer.from(db.export()));
  }
}

function run(sql, params = []) {
  db.run(sql, params);
  const result = db.exec("SELECT last_insert_rowid() as id");
  const lastId = result.length > 0 ? (result[0].values[0]?.[0] || 0) : 0;
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  return { lastInsertRowid: lastId };
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function exec(sql) {
  db.run(sql);
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

module.exports = { getDb, initializeDatabase, saveDb, run, get, all, exec };
