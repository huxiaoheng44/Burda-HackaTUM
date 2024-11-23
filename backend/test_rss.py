import asyncio
from src.app.feed_fetcher import FeedFetcher
from src.app.database import init_db
from loguru import logger

async def test_rss_feeds():
    try:
        # Initialize the database
        await init_db()
        logger.info("Database initialized")
        
        # Create feed fetcher instance
        fetcher = FeedFetcher()
        
        # Fetch all feeds
        logger.info("Starting feed fetch")
        await fetcher.fetch_all()
        logger.info("Feed fetch completed")
        
    except Exception as e:
        logger.error(f"Error during RSS test: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(test_rss_feeds())