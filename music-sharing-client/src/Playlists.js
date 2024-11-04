// src/Playlists.js

import React, { useState, useEffect, useRef } from 'react';
import TrackSelector from './TrackSelector';
import './Playlists.css';

const Playlists = ({ socket }) => {
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
    const [playlistTracks, setPlaylistTracks] = useState([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [showTrackSelector, setShowTrackSelector] = useState(false);
    const [currentTrackUrl, setCurrentTrackUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        fetch('http://localhost:1488/playlists')
            .then(response => response.json())
            .then(data => setPlaylists(data))
            .catch(error => console.error('Ошибка при получении плейлистов:', error));
    }, []);

    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'trackControl' && message.playlistId === selectedPlaylistId) {
                    handleTrackControlMessage(message);
                }
            };
        }
    }, [socket, selectedPlaylistId]);

    const fetchPlaylistTracks = (playlistId) => {
        fetch(`http://localhost:1488/playlists/${playlistId}/tracks`)
            .then(response => response.json())
            .then(data => {
                const tracksWithUrl = data.map(track => ({
                    ...track,
                    url: `http://localhost:1488/music/${track.title}`
                }));
                setPlaylistTracks(tracksWithUrl);
            })
            .catch(error => console.error('Ошибка при получении треков плейлиста:', error));
    };

    const createPlaylist = () => {
        if (!newPlaylistName.trim()) return;

        fetch('http://localhost:1488/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newPlaylistName, description: "My Playlist", userId: 1 })
        })
            .then(response => response.json())
            .then(data => {
                setPlaylists([...playlists, { id: data.playlistId, name: newPlaylistName }]);
                setNewPlaylistName('');
            })
            .catch(error => console.error('Ошибка при создании плейлиста:', error));
    };

    const openPlaylist = (playlistId) => {
        setSelectedPlaylistId(playlistId);
        fetchPlaylistTracks(playlistId);
    };

    const addTracksToPlaylist = (selectedTrackNames) => {
        if (!selectedPlaylistId || selectedTrackNames.length === 0) return;
    
        fetch(`http://localhost:1488/playlists/${selectedPlaylistId}/tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tracks: selectedTrackNames.map(name => ({ name })) })
        })
            .then(() => fetchPlaylistTracks(selectedPlaylistId))
            .catch(error => console.error('Ошибка при добавлении треков:', error));
    };

    const handleAddTracks = (selectedTrackNames) => {
        addTracksToPlaylist(selectedTrackNames);
        setShowTrackSelector(false);
    };

    const playSelectedTrack = (track) => {
        if (track.url) {
            setCurrentTrackUrl(track.url);
            setIsPlaying(true);
            if (audioRef.current) {
                audioRef.current.play();
                sendTrackControlMessage('play', track.url, audioRef.current.currentTime);
            }
        } else {
            console.warn('URL трека не найден.');
        }
    };

    const sendTrackControlMessage = (action, trackUrl, time = 0) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: 'trackControl',
                action,
                playlistId: selectedPlaylistId,
                trackUrl,
                time
            }));
        }
    };

    const handleTrackControlMessage = (message) => {
        if (message.action === 'play') {
            if (audioRef.current.src !== message.trackUrl) {
                audioRef.current.src = message.trackUrl;
                audioRef.current.load();
            }
            audioRef.current.currentTime = message.time;
            audioRef.current.play();
            setIsPlaying(true);
        } else if (message.action === 'pause') {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            sendTrackControlMessage('pause', currentTrackUrl, audioRef.current.currentTime);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
            sendTrackControlMessage('play', currentTrackUrl, audioRef.current.currentTime);
        }
    };

    const deletePlaylist = (playlistId) => {
        if (window.confirm("Вы уверены, что хотите удалить этот плейлист?")) {
            fetch(`http://localhost:1488/playlists/${playlistId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (response.ok) {
                        setPlaylists(playlists.filter(playlist => playlist.id !== playlistId));
                        setSelectedPlaylistId(null);
                    }
                })
                .catch(error => console.error('Ошибка при удалении плейлиста:', error));
        }
    };

    return (
        <div className="playlist-container">
            <h2>Плейлисты</h2>
            <input
                type="text"
                placeholder="Название плейлиста"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
            />
            <button onClick={createPlaylist}>Создать плейлист</button>

            <div className="playlist-grid">
                {playlists.map((playlist) => (
                    <div key={playlist.id} className="playlist-card">
                        <button 
                            className="delete-button" 
                            onClick={(e) => {
                                e.stopPropagation();
                                deletePlaylist(playlist.id);
                            }}
                        >
                            Удалить
                        </button>
                        <div className="playlist-card-name" onClick={() => openPlaylist(playlist.id)}>
                            {playlist.name}
                        </div>
                    </div>
                ))}
            </div>

            {selectedPlaylistId && (
                <div className="playlist-details">
                    <h3>Ваши треки:</h3>
                    {playlistTracks.length > 0 ? (
                        <ul>
                            {playlistTracks.map((track, index) => (
                                <li key={index} onClick={() => playSelectedTrack(track)} style={{ cursor: 'pointer' }}>
                                    {track.title || 'Без названия'}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>(Ваш плейлист пуст)</p>
                    )}
                    <button onClick={() => setShowTrackSelector(true)}>＋</button>
                    {showTrackSelector && (
                        <TrackSelector onAddTracks={handleAddTracks} onClose={() => setShowTrackSelector(false)} />
                    )}
                </div>
            )}

            {currentTrackUrl && (
                <div className="audio-player">
                    <audio ref={audioRef} src={currentTrackUrl} controls />
                    <button onClick={togglePlayPause}>
                        {isPlaying ? 'Пауза' : 'Воспроизвести'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Playlists;
