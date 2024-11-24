import React from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import { News } from '../types/news';
import PlayButton from './PlayButton';

interface NewsCardProps {
    news: News;
    onPlayClick: (articleId: number) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, onPlayClick }) => {
    const handlePlayClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onPlayClick(news.id);
    };

    return (
        <Link to={`/news/${news.id}`} className="block" data-article-id={news.id}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
                {news.image_url && (
                    <div className="relative h-48">
                        <img
                            src={news.image_url.startsWith('http') ? news.image_url : `${API_BASE_URL}${news.image_url}`}
                            alt={news.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                            <PlayButton
                                onClick={handlePlayClick}
                                className="bg-white/80 hover:bg-white shadow-md"
                            />
                        </div>
                    </div>
                )}
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold line-clamp-2">
                            {news.title}
                        </h3>
                    </div>
                    <p className="text-gray-600 line-clamp-3 mb-4">
                        {news.description}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{new Date(news.published_at).toLocaleDateString()}</span>
                        <span className="capitalize">{news.category}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default NewsCard;