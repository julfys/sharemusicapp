// src/Tracks.js

import React, { useState, useEffect } from 'react';

const Tracks = ({ playlistId }) => {
    const [tracks, setTracks] = useState([]); // Треки в плейлисте
    const [allTracks, setAllTracks] = useState([]); // Все доступные треки
    const [selectedTracks, setSelectedTracks] = useState([]); // Выбранные пользователем треки
    const [isModalOpen, setIsModalOpen] = useState(false); // Состояние модального окна
    const [searchTerm, setSearchTerm] = useState(''); // Поисковый запрос

    useEffect(() => {
        // Получаем треки из текущего плейлиста
        fetch(`http://localhost:1488/playlists/${playlistId}/tracks`)
            .then(response => response.json())
            .then(data => setTracks(data));

        // Получаем все доступные треки
        fetch('http://localhost:1488/tracks')
            .then(response => response.json())
            .then(data => setAllTracks(data));
    }, [playlistId]);

    // Обработчик для добавления выбранных треков в плейлист
    const addTracksToPlaylist = () => {
        const promises = selectedTracks.map(track => {
            return fetch(`http://localhost:1488/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: track.name, artist: 'Unknown' }) // Ваша логика для названия артиста
            });
        });

        Promise.all(promises)
            .then(() => {
                // После успешного добавления обновляем состояние треков в плейлисте
                setTracks(prevTracks => [...prevTracks, ...selectedTracks]); // Добавляем выбранные треки
                setSelectedTracks([]); // Очищаем выбранные треки
                setIsModalOpen(false); // Закрываем модальное окно
            })
            .catch(error => console.error('Ошибка при добавлении треков:', error));
    };

    // Обработчик для изменения поискового запроса
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Функция для фильтрации треков по имени
    const filteredTracks = allTracks.filter(track =>
        track.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <h2>Ваши треки:</h2>
            {tracks.length === 0 ? (
                <p>Ваш плейлист пуст.</p>
            ) : (
                <ul>
                    {tracks.map((track, index) => (
                        <li key={index}>
                            {track.title}
                        </li>
                    ))}
                </ul>
            )}
            <button onClick={() => setIsModalOpen(true)}>➕</button>

            {isModalOpen && (
                <div className="modal">
                    <h3>Выберите треки для плейлиста</h3>
                    <input
                        type="text"
                        placeholder="Поиск треков..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <ul>
                        {filteredTracks.map((track, index) => (
                            <li key={index}>
                                <input
                                    type="checkbox"
                                    value={track.name}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedTracks(prevSelected => [...prevSelected, track]);
                                        } else {
                                            setSelectedTracks(selectedTracks.filter(t => t.name !== track.name));
                                        }
                                    }}
                                />
                                {track.name}
                            </li>
                        ))}
                    </ul>
                    <button onClick={addTracksToPlaylist}>Добавить</button>
                    <button onClick={() => setIsModalOpen(false)}>Закрыть</button>
                </div>
            )}
        </div>
    );
};

export default Tracks;
