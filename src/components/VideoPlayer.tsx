import React, { useEffect, useState } from "react";
import { NewsArticle } from "../types/news";
import AudioService from "../services/audioService";

interface VideoPlayerProps {
  videoSrc: string;
  articles: NewsArticle[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoSrc, articles }) => {
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentArticle = articles[currentArticleIndex];

  useEffect(() => {
    let isMounted = true;

    const fetchAndPlayAudio = async () => {
      try {
        if (!currentArticle) return;

        // Get audio metadata for description
        const audioMetadata = await AudioService.getAudioMetadata(
          currentArticle.id,
          'description'
        );
        const audioUrl = AudioService.getAudioUrl(audioMetadata.filename);

        // Play the audio
        AudioService.play(audioUrl);

        // Get audio duration and update state
        const duration = audioMetadata.duration;
        if (isMounted) {
          setAudioDuration(duration);
          setIsPlaying(true);
        }

        // Register audio end event with 1 second pause
        const handleAudioEnd = () => {
          setIsPlaying(false);
          // Wait 1 second before playing next
          setTimeout(() => {
            if (isMounted) {
              const nextIndex = (currentArticleIndex + 1) % articles.length;
              setCurrentArticleIndex(nextIndex);
            }
          }, 1000);
        };

        AudioService.onEnded(handleAudioEnd);

        // Clean up this specific event listener when effect reruns
        return () => {
          AudioService.removeEndedListener(handleAudioEnd);
        };
      } catch (error) {
        console.error("Error fetching or playing audio:", error);
      }
    };

    // Auto-play first time
    fetchAndPlayAudio();

    // Clean up when component unmounts
    return () => {
      isMounted = false;
      AudioService.pause();
    };
  }, [currentArticleIndex, currentArticle, articles]);

  // Initial auto-play
  useEffect(() => {
    const initAutoPlay = async () => {
      try {
        if (!currentArticle) return;

        const audioMetadata = await AudioService.getAudioMetadata(
          currentArticle.id,
          'description'
        );
        const audioUrl = AudioService.getAudioUrl(audioMetadata.filename);

        // Create a user interaction event handler
        const handleUserInteraction = () => {
          AudioService.play(audioUrl);
          // Remove the event listeners after first interaction
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('touchstart', handleUserInteraction);
        };

        // Add event listeners for user interaction
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);

        // Clean up
        return () => {
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('touchstart', handleUserInteraction);
        };
      } catch (error) {
        console.error("Error setting up auto-play:", error);
      }
    };

    initAutoPlay();
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-black">
      {/* Video section */}
      <video
        src={videoSrc}
        className="w-full h-auto mx-auto"
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        controls={false}
      />

      {/* 左上角显示当前文章的图片 */}
      {currentArticle && (
        <div className="absolute top-4 left-4">
          <img
            src={currentArticle.image_url}
            alt={currentArticle.title}
            className="w-1/2 shadow-lg"
          />
        </div>
      )}

      {/* 显示当前播放的文章标题 */}
      {currentArticle && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-75 p-2 rounded text-black">
          <h2 className="text-lg font-bold">{currentArticle.title}</h2>
          <p className="text-sm">{currentArticle.description}</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
