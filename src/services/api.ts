export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export interface FetchArticlesParams {
  category?: string;
  timeFrame?: string;
}

export async function fetchArticles(params: FetchArticlesParams = {}) {
  const queryParams = new URLSearchParams();

  if (params.category) {
    queryParams.append("category", params.category);
  }

  if (params.timeFrame) {
    const days = {
      "24h": "1",
      "7d": "7",
      "30d": "30",
    }[params.timeFrame];

    if (days) {
      queryParams.append("days", days);
    }
  }

  const response = await fetch(`${API_BASE_URL}/news?${queryParams}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch articles: ${response.statusText}`);
  }
  return response.json();
}

export async function incrementViews(id: number) {
  const response = await fetch(`${API_BASE_URL}/news/${id}/view`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to increment views");
  }
  return response.json();
}

export async function incrementShares(id: number) {
  const response = await fetch(`${API_BASE_URL}/news/${id}/share`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to increment shares");
  }
  return response.json();
}
