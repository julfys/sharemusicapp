// src/TrackSelector.js

import React, { useEffect, useState } from 'react';

const TrackSelector = ({ onAddTracks }) => {
    const [tracks, setTracks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTracks, setSelectedTracks] = useState([]);

    useEffect(() => {
        // Загружаем список треков из папки
        fetch('http://localhost:1488/tracks')
            .then(response => response.json())
            .then(data => setTracks(data))
            .catch(error => console.error('Ошибка при загрузке треков:', error));
    }, []);

    const handleTrackClick = (track) => {
        // Добавляем или удаляем трек из выбранных
        setSelectedTracks(prevSelected => {
            if (prevSelected.includes(track)) {
                return prevSelected.filter(t => t !== track);
            } else {
                return [...prevSelected, track];
            }
        });
    };

    const handleAddTracks = () => {
        // Передаем массив названий треков
        const trackNames = selectedTracks.map(track => track.name);
        onAddTracks(trackNames);
    };

    const filteredTracks = tracks.filter(track =>
        track.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <h3>Выберите треки для плейлиста</h3>
            <input
                type="text"
                placeholder="Поиск треков..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div>
                {filteredTracks.length > 0 ? (
                    filteredTracks.map((track, index) => (
                        <div
                            key={index}
                            onClick={() => handleTrackClick(track)}
                            style={{
                                cursor: 'pointer',
                                backgroundColor: selectedTracks.includes(track) ? '#d3d3d3' : 'transparent',
                                padding: '5px',
                                margin: '5px 0'
                            }}
                        >
                            {track.name}
                        </div>
                    ))
                ) : (
                    <p>Треки не найдены.</p>
                )}
            </div>
            <button onClick={handleAddTracks}>Добавить</button>
        </div>
    );
};

export default TrackSelector;
