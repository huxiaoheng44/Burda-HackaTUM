import feedparser
import httpx
from datetime import datetime
from typing import Optional, Dict, Any
from loguru import logger
from dateutil.parser import parse as parse_date
import re
from bs4 import BeautifulSoup

from .database import get_db
from .models import NewsArticle

class FeedFetcher:
    RSS_FEEDS = [
        {
            "url": "https://rss.app/feeds/MLuDKqkwFtd2tuMr.xml",
            "category": "Technology"
        },
        {
            "url": "https://www.autobild.de/rss/22590661.xml",
            "category": "Automotive"
        },
        {
            "url": "https://rss.app/feed/AY3gpY8fWOkfCCWR",
            "category": "General"
        }
    ]
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def fetch_feed(self, url: str) -> Optional[Dict[str, Any]]:
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            return feedparser.parse(response.text)
        except Exception as e:
            logger.error(f"Error fetching feed {url}: {str(e)}")
            return None
    
    def extract_image_url(self, entry: Dict[str, Any]) -> Optional[str]:
        # Try media:content
        if hasattr(entry, 'media_content'):
            for media in entry.media_content:
                if media.get('type', '').startswith('image/'):
                    return media['url']
        
        # Try content
        if hasattr(entry, 'content'):
            for content in entry.content:
                if 'value' in content:
                    soup = BeautifulSoup(content['value'], 'html.parser')
                    img = soup.find('img')
                    if img and img.get('src'):
                        return img['src']
        
        # Try description
        if hasattr(entry, 'description'):
            soup = BeautifulSoup(entry.description, 'html.parser')
            img = soup.find('img')
            if img and img.get('src'):
                return img['src']
        
        return None
    
    def clean_html(self, html: str) -> str:
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text(separator=' ', strip=True)
    
    async def process_entry(self, entry: Dict[str, Any], category: str) -> Optional[NewsArticle]:
        try:
            # Extract and clean content
            content = entry.get('content', [{}])[0].get('value') or entry.get('description', '')
            clean_content = self.clean_html(content)
            
            # Extract and clean description
            description = entry.get('summary', '') or entry.get('description', '')
            clean_description = self.clean_html(description)
            
            # Parse publication date
            published = entry.get('published') or entry.get('updated')
            if published:
                published_at = parse_date(published)
            else:
                published_at = datetime.utcnow()
            
            return NewsArticle(
                guid=entry.get('id') or entry.get('link'),
                title=entry.get('title'),
                description=clean_description,
                content=clean_content,
                link=entry.get('link'),
                image_url=self.extract_image_url(entry),
                category=category,
                published_at=published_at
            )
        except Exception as e:
            logger.error(f"Error processing entry: {str(e)}")
            return None
    
    async def fetch_all(self):
        async with get_db() as db:
            for feed_info in self.RSS_FEEDS:
                feed = await self.fetch_feed(feed_info["url"])
                if not feed:
                    continue
                
                for entry in feed.entries:
                    article = await self.process_entry(entry, feed_info["category"])
                    if article:
                        existing = await db.query(NewsArticle) \
                                        .filter(NewsArticle.guid == article.guid) \
                                        .first()
                        
                        if not existing:
                            db.add(article)
                
                await db.commit()
        
        await self.client.aclose()