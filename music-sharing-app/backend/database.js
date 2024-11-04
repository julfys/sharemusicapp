// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Создаем базу данных в файле
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к SQLite базе данных');
    }
});

// Создаем таблицы пользователей и плейлистов, если они не существуют
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        userId INTEGER,
        FOREIGN KEY(userId) REFERENCES users(id)
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        artist TEXT,
        playlistId INTEGER,
        FOREIGN KEY(playlistId) REFERENCES playlists(id)
    )
`);

module.exports = db;
