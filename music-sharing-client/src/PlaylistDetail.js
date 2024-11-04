// src/PlaylistDetail.js

import React, { useState, useEffect } from 'react';
import TrackPlayer from './TrackPlayer';
import Chat from './Chat';

const PlaylistDetail = ({ playlistId, onClose }) => {
    const [tracks, setTracks] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [playlistName, setPlaylistName] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:1488/playlists/${playlistId}`)
            .then(response => response.json())
            .then(data => {
                setPlaylistName(data.name);
                setTracks(data.tracks);
            });
    }, [playlistId]);

    const handleTrackPlay = (track) => {
        setSelectedTrack(track);
    };

    const savePlaylistName = () => {
        fetch(`http://localhost:1488/playlists/${playlistId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: playlistName })
        })
            .then(response => response.json())
            .then(() => setIsEditing(false));
    };

    const deletePlaylist = () => {
        if (window.confirm("Вы уверены, что хотите удалить этот плейлист?")) {
            fetch(`http://localhost:1488/playlists/${playlistId}`, { method: 'DELETE' })
                .then(() => {
                    onClose();
                });
        }
    };

    return (
        <div className="playlist-detail">
            <div>
                {isEditing ? (
                    <>
                        <input
                            type="text"
                            value={playlistName}
                            onChange={(e) => setPlaylistName(e.target.value)}
                        />
                        <button onClick={savePlaylistName}>Сохранить</button>
                    </>
                ) : (
                    <>
                        <h3>{playlistName}</h3>
                        <button onClick={() => setIsEditing(true)}>Переименовать</button>
                    </>
                )}
                <button onClick={deletePlaylist} style={{ color: 'red' }}>Удалить плейлист</button>
            </div>
            <ul>
                {tracks.map(track => (
                    <li key={track.id} onClick={() => handleTrackPlay(track)}>
                        {track.title}
                    </li>
                ))}
            </ul>
            {selectedTrack && <TrackPlayer trackUrl={selectedTrack.url} roomId={playlistId} />}
            <Chat username="Текущий пользователь" roomId={playlistId} />
        </div>
    );
};

export default PlaylistDetail;

