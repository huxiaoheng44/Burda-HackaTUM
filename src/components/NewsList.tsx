import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { NewsArticle } from '../types/news';
import PlayButton from './PlayButton';
import AudioPlayer from './AudioPlayer';

interface NewsListProps {
  articles: NewsArticle[];
  onArticleClick: (id: number) => void;
}

export default function NewsList({ articles, onArticleClick }: NewsListProps) {
  const [playingArticleId, setPlayingArticleId] = useState<number | null>(null);

  const handlePlayClick = (e: React.MouseEvent, articleId: number) => {
    e.stopPropagation();
    setPlayingArticleId(articleId);
  };

  return (
    <>
      <div className="space-y-6 mb-24">
        {articles.map((article) => (
          <article
            key={article.id}
            data-article-id={article.id}
            onClick={() => onArticleClick(article.id)}
            className="group cursor-pointer rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg relative"
          >
            <div className="flex gap-6">
              <div className="h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg relative">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2">
                  <PlayButton
                    onClick={(e) => handlePlayClick(e, article.id)}
                    className="bg-white/80 hover:bg-white shadow-md"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-blue-600">
                    {article.title}
                  </h3>
                  <p className="text-gray-600">{article.description}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(article.published_at).toLocaleDateString()}
                  </div>
                  <span>·</span>
                  <span>{article.views.toLocaleString()} views</span>
                  <span>·</span>
                  <span>{article.shares.toLocaleString()} shares</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      {playingArticleId && (
        <AudioPlayer
          articleId={playingArticleId}
          onClose={() => setPlayingArticleId(null)}
        />
      )}
    </>
  );
}