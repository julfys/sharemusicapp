// src/App.js

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Playlists from './Playlists';
import Login from './Login';
import Register from './Register';
import Chat from './Chat';  // Импортируем чат

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const socketRef = useRef(null);  // Используем useRef для хранения cd -соединения

    useEffect(() => {
        // Инициализируем WebSocket-соединение один раз и сохраняем его в socketRef
        socketRef.current = new WebSocket('ws://localhost:1408');
    
        // Обработчик при закрытии соединения
        socketRef.current.onclose = () => {
            console.log('WebSocket закрыт');
        };
    
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    const handleLogin = (userLogin) => {
        setIsAuthenticated(true);
        setUsername(userLogin);
    };

    return (
        <Router>
            <div className="App">
                <h1>Music Sharing App</h1>
                <Routes>
                    <Route
                        path="/"
                        element={isAuthenticated ? (
                            <>
                                <Playlists socket={socketRef.current} />
                                <Chat username={username} /> {/* Добавляем чат под плейлистами */}
                            </>
                        ) : (
                            <Navigate to="/login" />
                        )}
                    />
                    <Route
                        path="/login"
                        element={isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
                    />
                    <Route
                        path="/register"
                        element={isAuthenticated ? <Navigate to="/" /> : <Register />}
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
