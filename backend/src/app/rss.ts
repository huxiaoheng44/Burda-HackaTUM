import Parser from 'rss-parser';
import { RSS_FEEDS, MAX_RETRIES, RETRY_DELAY } from './config';
import { logger } from './logger';
import { NewsRepository } from './db';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'content']
    ]
  }
});

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<any> {
  try {
    return await parser.parseURL(url);
  } catch (error) {
    if (retries > 0) {
      logger.warn(`Retrying fetch for ${url}, ${retries} attempts remaining`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
}

function extractImageUrl(item: any): string | null {
  if (item.media?.$.url) {
    return item.media.$.url;
  }
  
  // Try to extract image from content
  const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

export async function fetchAndStoreFeeds() {
  const repo = new NewsRepository();
  let successCount = 0;
  let errorCount = 0;

  for (const feed of RSS_FEEDS) {
    try {
      logger.info(`Fetching feed: ${feed.url}`);
      const feedData = await fetchWithRetry(feed.url);

      for (const item of feedData.items) {
        const article = {
          guid: item.guid || item.link,
          title: item.title,
          description: item.description?.replace(/<[^>]+>/g, ''),
          content: item.content || item['content:encoded'],
          link: item.link,
          publishedAt: new Date(item.pubDate || item.isoDate).toISOString(),
          imageUrl: extractImageUrl(item),
          category: feed.category
        };

        const added = repo.addArticle(article);
        if (added) {
          successCount++;
        }
      }
    } catch (error) {
      errorCount++;
      logger.error(`Error processing feed ${feed.url}:`, error);
    }
  }

  logger.info(`Feed update completed. Added ${successCount} articles. ${errorCount} feeds failed.`);
}