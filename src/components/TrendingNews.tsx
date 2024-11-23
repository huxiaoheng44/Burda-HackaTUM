import React from 'react';
import { TrendingUp } from 'lucide-react';
import { NewsArticle } from '../types/news';

interface TrendingNewsProps {
  articles: NewsArticle[];
  onArticleClick: (id: number) => void;
}

export default function TrendingNews({ articles, onArticleClick }: TrendingNewsProps) {
  const sortedArticles = [...articles].sort((a, b) => b.views - a.views);

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Trending Now</h2>
      </div>
      <div className="space-y-4">
        {sortedArticles.map((article, index) => (
          <div
            key={article.id}
            onClick={() => onArticleClick(article.id)}
            className="group flex cursor-pointer items-start gap-4"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-sm font-bold text-gray-600">
              {index + 1}
            </span>
            <div>
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                {article.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {article.views.toLocaleString()} views
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}