export interface NewsArticle {
  id: number;
  title: string;
  description: string;
  content: string;
  published_at: string;
  image_url: string;
  link: string;
  views: number;
  shares: number;
  category: string;
}

export interface NewsState {
  articles: NewsArticle[];
  currentSlide: number;
}