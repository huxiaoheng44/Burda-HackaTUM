import React, { useState, useMemo } from "react";
import NewsCarousel from "./components/NewsCarousel";
import NewsList from "./components/NewsList";
import TrendingNews from "./components/TrendingNews";
import NewsDetail from "./components/NewsDetail";
import NewsFilters from "./components/NewsFilters";
import LoadingSpinner from "./components/LoadingSpinner";
import { useNews } from "./hooks/useNews";
import { Filters } from "./types/filters";
import { filterArticles } from "./utils/filterArticles";
import VideoPlayer from "./components/VideoPlayer";
import videoFile from "./source/news.mp4";

function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>({
    category: null,
    timeFrame: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const { articles, loading, error } = useNews(filters);

  const categories = useMemo(
    () =>
      Array.from(new Set(articles.map((article) => article.category))).sort(),
    [articles]
  );

  const filteredArticles = useMemo(() => {
    const filtered = filterArticles(articles, filters);
    if (searchQuery) {
      return filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [articles, filters, searchQuery]);

  const currentArticle =
    selectedArticle !== null
      ? articles.find((article) => article.id === selectedArticle)
      : null;

  const relatedArticles = currentArticle
    ? articles
        .filter(
          (article) =>
            article.id !== currentArticle.id &&
            article.category === currentArticle.category
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
    : [];

  if (currentArticle) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <img src="./logo.svg" alt="Logo" className="h-10" />
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
      <header className="border-b bg-white shadow-sm flex items-center justify-between px-8 py-4">
        <div className="flex-shrink-0">
          <img src="./logo.svg" alt="Logo" className="h-10" />
        </div>

        <div className="w-max-1/2 relative">
          <input
            type="text"
            placeholder="Search for articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full">
            <VideoPlayer videoSrc={videoFile} articles={articles} />
          </div>
        </div>

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
                articles={filteredArticles.slice(0, 5)}
                currentSlide={currentSlide}
                setCurrentSlide={setCurrentSlide}
              />
            </div>
            <NewsFilters
              filters={filters}
              categories={categories}
              onFilterChange={setFilters}
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {filters.category || "Latest"} News
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
