// src/Chat.js
import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ username }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = new WebSocket('ws://localhost:1408'); // Публичный IP
    
        socketRef.current.onopen = () => {
            console.log('WebSocket подключен');
        };
    
        socketRef.current.onmessage = (event) => {
            const messageData = JSON.parse(event.data);
            if (messageData.type === 'chat') {
                setMessages((prevMessages) => [...prevMessages, messageData]);
            }
        };
    
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);
    

    const sendMessage = () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const message = { type: 'chat', username: username, text: input };
            socketRef.current.send(JSON.stringify(message));
            setInput('');
        }
    };

    return (
        <div>
            <h2>ЧАТ</h2>
            <div>
                {messages.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.username}</strong> ({msg.timestamp}): {msg.text}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}>Отправить</button>
        </div>
    );
};

export default Chat;
