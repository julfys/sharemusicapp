const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const musicFolder = path.join("C:\\Users\\julfy\\Documents\\js\\Crystal Castles");

const allowedOrigins = [
    'http://46.138.245.14:3000',
    'http://46.138.245.14:1488',
    'http://localhost:3000',
    'http://localhost:1488'
];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Подключение body-parser для работы с JSON-запросами
app.use(bodyParser.json());

// Настройка Content-Security-Policy
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "connect-src 'self' ws://localhost:1408 http://localhost:1488 ws://46.138.245.14:1408 http://46.138.245.14:1488; " +
    "media-src 'self' http://46.138.245.14:1488; " +
    "style-src 'self' 'unsafe-inline'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "frame-ancestors 'self'; " +
    "object-src 'none'"
);
    next();
});

// Маршруты для работы с пользователями, плейлистами и треками
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], (err) => {
            if (err) {
                if (err.message.includes("UNIQUE")) {
                    return res.status(400).json({ message: 'Пользователь уже существует' });
                }
                return res.status(500).json({ message: 'Ошибка сервера' });
            }
            res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ message: 'Ошибка сервера' });
        if (!user) return res.status(400).json({ message: 'Неверный логин или пароль' });

        try {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Неверный логин или пароль' });
            }
            res.status(200).json({ message: 'Успешный вход' });
        } catch {
            res.status(500).json({ message: 'Ошибка при проверке пароля' });
        }
    });
});

// Создание нового плейлиста
app.post('/playlists', (req, res) => {
    const { name, description, userId } = req.body;
    db.run(`INSERT INTO playlists (name, description, userId) VALUES (?, ?, ?)`, [name, description, userId], function (err) {
        if (err) return res.status(500).json({ message: 'Ошибка при создании плейлиста' });
        const playlistId = this.lastID;
        res.status(201).json({ message: 'Плейлист создан', playlistId });
    });
});

// Получение всех плейлистов
app.get('/playlists', (req, res) => {
    db.all(`SELECT * FROM playlists`, [], (err, playlists) => {
        if (err) return res.status(500).json({ message: 'Ошибка при получении плейлистов' });
        res.status(200).json(playlists);
    });
});

// Удаление плейлиста и его треков
app.delete('/playlists/:playlistId', (req, res) => {
    const { playlistId } = req.params;

    db.run(`DELETE FROM tracks WHERE playlistId = ?`, [playlistId], (err) => {
        if (err) return res.status(500).json({ message: 'Ошибка при удалении треков' });

        db.run(`DELETE FROM playlists WHERE id = ?`, [playlistId], function (err) {
            if (err) return res.status(500).json({ message: 'Ошибка при удалении плейлиста' });
            res.status(200).json({ message: 'Плейлист и его треки удалены' });
        });
    });
});

// Обновление имени плейлиста
app.put('/playlists/:playlistId', (req, res) => {
    const { playlistId } = req.params;
    const { name } = req.body;

    db.run(`UPDATE playlists SET name = ? WHERE id = ?`, [name, playlistId], function (err) {
        if (err) return res.status(500).json({ message: 'Ошибка при обновлении плейлиста' });
        res.status(200).json({ message: 'Плейлист обновлен' });
    });
});

// Добавление треков в существующий плейлист
app.post('/playlists/:playlistId/tracks', (req, res) => {
    const { playlistId } = req.params;
    const { tracks } = req.body;

    if (!tracks || tracks.length === 0) {
        return res.status(400).json({ message: 'Нет треков для добавления' });
    }

    const trackInserts = tracks.map(track =>
        new Promise((resolve, reject) => {
            db.run(`INSERT INTO tracks (title, artist, playlistId) VALUES (?, ?, ?)`, [track.name, 'Unknown', playlistId], function (err) {
                if (err) reject(err);
                resolve();
            });
        })
    );

    Promise.all(trackInserts)
        .then(() => res.status(201).json({ message: 'Треки добавлены в плейлист' }))
        .catch(() => res.status(500).json({ message: 'Ошибка при добавлении треков в плейлист' }));
});

// Получение всех треков из конкретного плейлиста
app.get('/playlists/:playlistId/tracks', (req, res) => {
    const { playlistId } = req.params;
    db.all(`SELECT * FROM tracks WHERE playlistId = ?`, [playlistId], (err, tracks) => {
        if (err) return res.status(500).json({ message: 'Ошибка при получении треков' });
        const tracksWithUrl = tracks.map(track => ({
            ...track,
            url: `/music/${track.title}`
        }));
        res.status(200).json(tracksWithUrl);
    });
});

// Список треков из папки с музыкой
app.get('/tracks', (req, res) => {
    fs.readdir(musicFolder, (err, files) => {
        if (err) {
            console.error('Ошибка чтения папки с музыкой:', err);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }

        const supportedExtensions = ['.mp3', '.wav'];
        const tracks = files
            .filter(file => supportedExtensions.includes(path.extname(file)))
            .map(file => ({ name: file, url: `/music/${file}` }));

        res.status(200).json(tracks);
    });
});

// Сервируем файлы из папки с музыкой
app.use('/music', express.static(musicFolder));

// WebSocket-сервер на порту 1408
const wss = new WebSocket.Server({ port: 1408, host: '0.0.0.0' });

wss.on('connection', (ws) => {
    console.log('Новое подключение WebSocket');

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);

            if (parsedMessage.type === 'trackControl') {
                const { action, roomId, time } = parsedMessage;
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'trackControl', action, roomId, time }));
                    }
                });
            } else if (parsedMessage.type === 'chat') {
                const formattedMessage = {
                    username: parsedMessage.username,
                    text: parsedMessage.text,
                    timestamp: new Date().toLocaleString()
                };

                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'chat', ...formattedMessage }));
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка обработки сообщения WebSocket:', error);
        }
    });

    ws.on('close', () => {
        console.log('Клиент отключен');
    });
});

// Запуск HTTP-сервера на порту 1488
const PORT = 1488;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP-сервер запущен на http://46.138.245.14:${PORT}`);
});
