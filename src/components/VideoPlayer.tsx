import React, { useEffect, useState, useRef } from "react";
import { NewsArticle } from "../types/news";
import AudioService from "../services/audioService";
import { API_BASE_URL } from "../services/api";

interface VideoPlayerProps {
  videoSrc: string;
  articles: NewsArticle[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoSrc, articles }) => {
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioMetadata, setAudioMetadata] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentArticle = articles[currentArticleIndex];

  const togglePlayPause = () => {
    if (isPlaying) {
      AudioService.pause();
      videoRef.current?.pause();
    } else if (audioMetadata) {
      AudioService.play(
        AudioService.getAudioUrl(audioMetadata.filename),
        currentArticle.id,
        "description"
      );
      videoRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAndPlayAudio = async () => {
      try {
        if (!currentArticle) return;

        // Reset states when changing article
        setIsPlaying(false);
        AudioService.pause();
        videoRef.current?.pause();

        // Get audio metadata for description
        const metadata = await AudioService.getAudioMetadata(
          currentArticle.id,
          "description"
        );

        if (isMounted) {
          setAudioMetadata(metadata);
          setAudioDuration(metadata.duration);

          // Play audio and video
          const audioUrl = AudioService.getAudioUrl(metadata.filename);
          AudioService.play(audioUrl, currentArticle.id, "description");
          videoRef.current?.play();
          setIsPlaying(true);
        }

        // Register audio end event with 1 second pause
        const handleAudioEnd = () => {
          setIsPlaying(false);
          videoRef.current?.pause();
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
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [currentArticleIndex, currentArticle, articles]);

  // Initial auto-play
  useEffect(() => {
    const initAutoPlay = async () => {
      try {
        if (!currentArticle) return;

        const audioMetadata = await AudioService.getAudioMetadata(
          currentArticle.id,
          "description"
        );
        const audioUrl = AudioService.getAudioUrl(audioMetadata.filename);

        // Create a user interaction event handler
        const handleUserInteraction = () => {
          AudioService.play(audioUrl, currentArticle.id, "description");
          // Remove the event listeners after first interaction
          document.removeEventListener("click", handleUserInteraction);
          document.removeEventListener("touchstart", handleUserInteraction);
        };

        // Add event listeners for user interaction
        document.addEventListener("click", handleUserInteraction);
        document.addEventListener("touchstart", handleUserInteraction);

        // Clean up
        return () => {
          document.removeEventListener("click", handleUserInteraction);
          document.removeEventListener("touchstart", handleUserInteraction);
        };
      } catch (error) {
        console.error("Error setting up auto-play:", error);
      }
    };

    initAutoPlay();
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-black my-10 rounded-lg">
      {/* Video section */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-auto mx-auto"
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        controls={false}
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="absolute top-4 right-4 p-2 rounded-full bg-white bg-opacity-75 hover:bg-opacity-100 transition-all"
      >
        {isPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>

      {currentArticle && (
        <div className="absolute top-4 left-4">
          <img
            src={
              currentArticle.image_url.startsWith("http")
                ? currentArticle.image_url
                : `${API_BASE_URL}${currentArticle.image_url}`
            }
            alt={currentArticle.title}
            className="w-1/2 shadow-lg"
          />
        </div>
      )}

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
