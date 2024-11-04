// src/TrackPlayer.js
import React, { useRef, useState, useEffect } from 'react';

const TrackPlayer = ({ trackUrl, socket, playlistId }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                const messageData = JSON.parse(event.data);

                if (messageData.type === 'trackControl' && messageData.playlistId === playlistId) {
                    if (messageData.action === 'play') {
                        audioRef.current.currentTime = messageData.time;
                        audioRef.current.play();
                        setIsPlaying(true);
                    } else if (messageData.action === 'pause') {
                        audioRef.current.pause();
                        setIsPlaying(false);
                    }
                }
            };
        }
    }, [socket, playlistId]);

    const playTrack = () => {
        audioRef.current.play();
        setIsPlaying(true);
        sendTrackControl('play', audioRef.current.currentTime);
    };

    const pauseTrack = () => {
        audioRef.current.pause();
        setIsPlaying(false);
        sendTrackControl('pause', audioRef.current.currentTime);
    };

    const sendTrackControl = (action, time) => {
        if (socket) {
            socket.send(JSON.stringify({ type: 'trackControl', action, playlistId, trackUrl, time }));
        }
    };

    return (
        <div>
            <audio ref={audioRef} src={trackUrl} />
            <button onClick={isPlaying ? pauseTrack : playTrack}>
                {isPlaying ? 'Пауза' : 'Воспроизвести'}
            </button>
        </div>
    );
};

export default TrackPlayer;
