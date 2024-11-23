import React, { useState, useMemo } from 'react';
import NewsCarousel from './components/NewsCarousel';
import NewsList from './components/NewsList';
import TrendingNews from './components/TrendingNews';
import NewsDetail from './components/NewsDetail';
import NewsFilters from './components/NewsFilters';
import LoadingSpinner from './components/LoadingSpinner';
import { useNews } from './hooks/useNews';
import { Filters } from './types/filters';
import { filterArticles } from './utils/filterArticles';

function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>({
    category: null,
    timeFrame: 'all'
  });

  const { articles, loading, error } = useNews(filters);

  const categories = useMemo(() => 
    Array.from(new Set(articles.map(article => article.category))).sort(),
    [articles]
  );

  const filteredArticles = useMemo(() => 
    filterArticles(articles, filters),
    [articles, filters]
  );

  const currentArticle = selectedArticle !== null 
    ? articles.find(article => article.id === selectedArticle)
    : null;

  const relatedArticles = currentArticle
    ? articles
        .filter(article => 
          article.id !== currentArticle.id && 
          (article.category === currentArticle.category || 
           article.tags.some(tag => currentArticle.tags.includes(tag)))
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
    : [];

  if (currentArticle) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Global News</h1>
          </div>
        </header>

        <NewsDetail
          article={currentArticle}
          onBack={() => setSelectedArticle(null)}
          relatedArticles={relatedArticles}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Global News</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <NewsFilters
          filters={filters}
          categories={categories}
          onFilterChange={setFilters}
        />

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            <p>Error loading articles. Showing cached data instead.</p>
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="mb-12">
              <NewsCarousel
                articles={filteredArticles}
                currentSlide={currentSlide}
                setCurrentSlide={setCurrentSlide}
              />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {filters.category || 'Latest'} News
                  </h2>
                  <p className="text-sm text-gray-500">
                    {filteredArticles.length} articles found
                  </p>
                </div>
                <NewsList 
                  articles={filteredArticles}
                  onArticleClick={(id) => setSelectedArticle(id)}
                />
              </div>
              
              <div className="lg:col-span-1">
                <TrendingNews 
                  articles={filteredArticles}
                  onArticleClick={(id) => setSelectedArticle(id)}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;