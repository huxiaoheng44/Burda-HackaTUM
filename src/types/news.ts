export interface NewsArticle {
  id: number;
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  imageUrl: string;
  views: number;
  shares: number;
  author: {
    name: string;
    avatar: string;
  };
  category: string;
  tags: string[];
}

export interface NewsState {
  featured: NewsArticle[];
  latest: NewsArticle[];
  trending: NewsArticle[];
  currentSlide: number;
}