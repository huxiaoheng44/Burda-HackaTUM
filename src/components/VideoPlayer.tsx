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
  const isMountedRef = useRef(true); // 添加 isMounted ref

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

  const playNextArticle = async () => {
    if (!isMountedRef.current) return;

    const nextIndex = (currentArticleIndex + 1) % articles.length;
    setCurrentArticleIndex(nextIndex);

    try {
      const nextArticle = articles[nextIndex];
      const metadata = await AudioService.getAudioMetadata(
        nextArticle.id,
        "description"
      );

      if (!isMountedRef.current) return;

      setAudioMetadata(metadata);
      setAudioDuration(metadata.duration);

      // 直接开始播放下一篇文章
      const audioUrl = AudioService.getAudioUrl(metadata.filename);
      AudioService.play(audioUrl, nextArticle.id, "description");
      videoRef.current?.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing next article:", error);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const fetchAndPlayAudio = async () => {
      try {
        if (!currentArticle) return;

        // Reset states when changing article
        setIsPlaying(false);
        AudioService.pause();
        videoRef.current?.pause();

        // Fetch audio metadata
        const metadata = await AudioService.getAudioMetadata(
          currentArticle.id,
          "description"
        );

        if (isMountedRef.current) {
          setAudioMetadata(metadata);
          setAudioDuration(metadata.duration);

          // Play audio and video
          const audioUrl = AudioService.getAudioUrl(metadata.filename);
          AudioService.play(audioUrl, currentArticle.id, "description");
          videoRef.current?.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Error fetching or playing audio:", error);
      }
    };

    // Register and handle audio end
    const handleAudioEnd = () => {
      if (isMountedRef.current) {
        setIsPlaying(false);
        videoRef.current?.pause();

        // 直接调用 playNextArticle 而不是使用 setTimeout
        playNextArticle();
      }
    };

    // 只在组件首次加载时执行初始化播放
    if (currentArticleIndex === 0) {
      fetchAndPlayAudio();
    }

    AudioService.onEnded(handleAudioEnd);

    return () => {
      isMountedRef.current = false;
      AudioService.removeEndedListener(handleAudioEnd);
      AudioService.pause();
      videoRef.current?.pause();
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
          if (isMountedRef.current) {
            AudioService.play(audioUrl, currentArticle.id, "description");
            videoRef.current?.play();
            setIsPlaying(true);
          }
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
        <div className="absolute top-6 left-6">
          <img
            src={
              currentArticle.image_url.startsWith("http")
                ? currentArticle.image_url
                : `${API_BASE_URL}${currentArticle.image_url}`
            }
            alt={currentArticle.title}
            className="w-3/5 aspect-video object-cover shadow-lg rounded-lg"
          />
        </div>
      )}

      {currentArticle && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 p-2 rounded w-max-full text-white">
          <p className="lg:text-xl">{currentArticle.description}</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
