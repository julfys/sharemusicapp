// src/Register.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleRegister = (e) => {
        e.preventDefault();

        fetch('http://localhost:1488/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Пользователь успешно зарегистрирован') {
                    setMessage('Регистрация успешна! Войдите в систему.');
                } else {
                    setMessage('Ошибка: ' + data.message);
                }
            })
            .catch(() => setMessage('Ошибка соединения с сервером'));
    };

    return (
        <div>
            <h2>Регистрация</h2>
            <form onSubmit={handleRegister}>
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
                <button type="submit">Зарегистрироваться</button>
            </form>
            {message && <p>{message}</p>}
            <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
        </div>
    );
};

export default Register;
