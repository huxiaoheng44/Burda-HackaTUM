import React, { useState } from 'react';
import { ArrowLeft, Clock, Share2, Eye } from 'lucide-react';
import { NewsArticle } from '../types/news';
import PlayButton from './PlayButton';
import AudioPlayer from './AudioPlayer';
import ChatBot from './ChatBot';

interface NewsDetailProps {
  article: NewsArticle;
  onBack: () => void;
  relatedArticles: NewsArticle[];
}

export default function NewsDetail({ article, onBack, relatedArticles }: NewsDetailProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 mb-24">
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to News
      </button>

      <article>
        <div className="relative">
          <img
            src={article.image_url}
            alt={article.title}
            className="aspect-video w-full rounded-xl object-cover"
          />
          <div className="absolute top-4 right-4">
            <PlayButton
              onClick={() => setIsPlaying(true)}
              className="bg-white/80 hover:bg-white shadow-md"
            />
          </div>
        </div>

        <div className="mt-8">
          <h1 className="mt-4 text-4xl font-bold text-gray-900">{article.title}</h1>

          <div className="mt-6 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-gray-500">{article.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(article.published_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.views.toLocaleString()} views
              </div>
              <div className="flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                {article.shares.toLocaleString()} shares
              </div>
            </div>
          </div>

          <div className="prose prose-lg mt-8 max-w-none">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>

      {isPlaying && (
        <AudioPlayer
          articleId={article.id}
          onClose={() => setIsPlaying(false)}
        />
      )}

      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900">Related Articles</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {relatedArticles.slice(0, 2).map((related) => (
            <div
              key={related.id}
              className="group cursor-pointer overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={related.image_url}
                  alt={related.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600">
                  {related.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{related.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ChatBot />
    </div>
  );
}