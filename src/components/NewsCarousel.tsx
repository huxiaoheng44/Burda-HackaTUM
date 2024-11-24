import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NewsArticle } from "../types/news";
import { API_BASE_URL } from "../services/api";

interface NewsCarouselProps {
  articles: NewsArticle[];
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
}

export default function NewsCarousel({
  articles,
  currentSlide,
  setCurrentSlide,
}: NewsCarouselProps) {
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((currentSlide + 1) % articles.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentSlide, articles.length, setCurrentSlide]);

  const prevSlide = () => {
    setCurrentSlide(
      currentSlide === 0 ? articles.length - 1 : currentSlide - 1
    );
  };

  const nextSlide = () => {
    setCurrentSlide((currentSlide + 1) % articles.length);
  };

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl bg-gray-900">
      {articles.map((article, index) => (
        <div
          key={article.id}
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            index === currentSlide ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            transform: `translateX(${100 * (index - currentSlide)}%)`,
          }}
        >
          <div className="relative h-full">
            <img
              src={`${API_BASE_URL}${article.image_url}`}
              alt={article.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h2 className="mb-2 text-4xl font-bold text-white">
                {article.title}
              </h2>
              <p className="text-lg text-gray-200">{article.description}</p>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-sm transition hover:bg-white/30"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-sm transition hover:bg-white/30"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {articles.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 w-2 rounded-full transition ${
              index === currentSlide ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
