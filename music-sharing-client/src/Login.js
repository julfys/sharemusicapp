// src/Login.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();

        fetch('http://localhost:1488/login', {  // Заменено на localhost
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        
            .then(response => response.json().then(data => ({ status: response.status, ...data })))
            .then(data => {
                if (data.status === 200 && data.message === 'Успешный вход') {
                    onLogin(username);  // Передаем логин при успешном входе
                } else {
                    setError(data.message || 'Ошибка при входе');
                }
            })
            .catch(err => {
                console.error('Ошибка соединения:', err);
                setError('Ошибка соединения с сервером');
            });
    };

    return (
        <div>
            <h2>Вход</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Логин"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Войти</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <p>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
        </div>
    );
};

export default Login;
