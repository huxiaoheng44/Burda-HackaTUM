import React, { useEffect, useState } from 'react';
import audioService, { AudioMetadata } from '../services/audioService';

import { AudioType } from '../types/audio';

interface AudioPlayerProps {
    articleId: number;
    type?: AudioType;
    onClose?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ articleId, type = 'full', onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null);

    useEffect(() => {
        const loadAudio = async () => {
            try {
                let metadata = await audioService.getAudioMetadata(articleId, type);
                if (!metadata) {
                    metadata = await audioService.generateAudio(articleId, type);
                }
                setAudioMetadata(metadata);
                setDuration(metadata.duration);
                setCurrentTime(0);
                setIsPlaying(false);
            } catch (error) {
                console.error('Failed to load audio:', error);
            }
        };

        // Subscribe to audio changes
        const unsubscribe = audioService.subscribe((newArticleId, newType) => {
            if (newArticleId !== articleId || newType !== type) {
                // Another audio started playing, close this player if it has onClose
                onClose?.();
            }
        });

        loadAudio();

        const handleTimeUpdate = () => {
            setCurrentTime(audioService.getCurrentTime());
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audioService.onTimeUpdate(handleTimeUpdate);
        audioService.onEnded(handleEnded);

        return () => {
            audioService.removeTimeUpdateListener(handleTimeUpdate);
            audioService.removeEndedListener(handleEnded);
            unsubscribe();
        };
    }, [articleId]);

    const togglePlayPause = () => {
        if (!audioMetadata) return;

        if (isPlaying) {
            audioService.pause();
        } else {
            const audioUrl = audioService.getAudioUrl(audioMetadata.filename);
            audioService.play(audioUrl, articleId, type);
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(event.target.value);
        audioService.setCurrentTime(time);
        setCurrentTime(time);
    };

    const handlePlaybackRateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const rate = parseFloat(event.target.value);
        audioService.setPlaybackRate(rate);
        setPlaybackRate(rate);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
                <button
                    onClick={togglePlayPause}
                    className="p-2 rounded-full hover:bg-gray-100"
                >
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </button>

                <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1"
                    />
                    <span className="text-sm">{formatTime(duration)}</span>
                </div>

                <select
                    value={playbackRate}
                    onChange={handlePlaybackRateChange}
                    className="p-1 border rounded"
                >
                    <option value="0.5">0.5x</option>
                    <option value="1">1x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                </select>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default AudioPlayer;