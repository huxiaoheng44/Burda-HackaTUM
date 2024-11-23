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

        // 获取音频元数据
        const audioMetadata = await AudioService.getAudioMetadata(
          currentArticle.id
        );
        const audioUrl = AudioService.getAudioUrl(audioMetadata.filename);

        // 播放音频
        AudioService.play(audioUrl);

        // 获取音频时长并更新状态
        const duration = audioMetadata.duration;
        if (isMounted) {
          setAudioDuration(duration);
          setIsPlaying(true);
        }

        // 注册音频结束事件
        AudioService.onEnded(() => {
          setIsPlaying(false);
          const nextIndex = (currentArticleIndex + 1) % articles.length; // 循环播放
          setCurrentArticleIndex(nextIndex);
        });
      } catch (error) {
        console.error("Error fetching or playing audio:", error);
      }
    };

    fetchAndPlayAudio();

    // 清除事件监听器
    return () => {
      isMounted = false;
      AudioService.pause();
      AudioService.removeEndedListener(() => {});
    };
  }, [currentArticleIndex, currentArticle, articles]);

  return (
    <div className="relative w-full overflow-hidden bg-black">
      {/* 视频部分 */}
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
