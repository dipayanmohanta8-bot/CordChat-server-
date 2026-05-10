const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./cordchat.db");

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT,
            receiver TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS groups_table (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS group_members (
            group_name TEXT,
            username TEXT
        )
    `);

});
db.run(`
    CREATE TABLE IF NOT EXISTS friends (
        sender TEXT,
        receiver TEXT,
        status TEXT
    )
`);
module.exports = db;