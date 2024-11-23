import { NewsArticle } from '../types/news';
import { Filters, TimeFilter } from '../types/filters';

const getTimeThreshold = (timeFrame: TimeFilter): Date => {
  const now = new Date();
  switch (timeFrame) {
    case '24h':
      return new Date(now.setHours(now.getHours() - 24));
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    default:
      return new Date(0);
  }
};

export const filterArticles = (articles: NewsArticle[], filters: Filters): NewsArticle[] => {
  const timeThreshold = getTimeThreshold(filters.timeFrame);

  return articles.filter((article) => {
    const matchesCategory = !filters.category || article.category === filters.category;
    const matchesTime = new Date(article.publishedAt) >= timeThreshold;
    return matchesCategory && matchesTime;
  });
};