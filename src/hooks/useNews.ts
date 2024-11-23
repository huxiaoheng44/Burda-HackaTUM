import { useState, useEffect } from 'react';
import { NewsArticle } from '../types/news';
import { Filters } from '../types/filters';
import { mockNews } from '../data/mockNews';
import { fetchArticles } from '../services/api';

export function useNews(filters: Filters) {
  const [articles, setArticles] = useState<NewsArticle[]>(mockNews);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadArticles() {
      try {
        setLoading(true);
        const data = await fetchArticles({
          category: filters.category || undefined,
          timeFrame: filters.timeFrame === 'all' ? undefined : filters.timeFrame
        });

        if (mounted) {
          setArticles(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch articles:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch articles'));
          // Fallback to mock data on error
          setArticles(mockNews);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadArticles();

    return () => {
      mounted = false;
    };
  }, [filters]);

  return { articles, loading, error };
}