from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from .feed_fetcher import FeedFetcher

def setup_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    
    async def fetch_feeds():
        try:
            fetcher = FeedFetcher()
            await fetcher.fetch_all()
            logger.info("Scheduled feed fetch completed successfully")
        except Exception as e:
            logger.error(f"Scheduled feed fetch failed: {str(e)}")
    
    # # Run every hour
    # scheduler.add_job(
    #     fetch_feeds,
    #     CronTrigger(minute=0),  # Run at the start of every hour
    #     id="fetch_feeds",
    #     name="Fetch RSS Feeds",
    #     replace_existing=True
    # )
    
    # Run news crew every 2 hours
    # scheduler.add_job(
    #     CronTrigger(minute=30, hour='*/2'),  # Run every 2 hours at minute 30
    #     id="run_news_crew",
    #     name="Run News Crew",
    #     replace_existing=True
    # )
    
    return scheduler