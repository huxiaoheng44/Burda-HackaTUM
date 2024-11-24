import json
import os
from loguru import logger
from datetime import datetime
from dateutil.parser import parse as parse_date
from news_crew.crew import EVNewsWriterCrew
from .database import get_db
from .models import NewsArticle

class NewsCrewService:
    def __init__(self):
        self.crew = EVNewsWriterCrew()
        self.output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "news_crew", "src", "news_crew", "output")
        os.makedirs(self.output_dir, exist_ok=True)

    async def run_crew(self):
        """Run the news crew to fetch and process news"""
        try:
            # Run the crew
            inputs = {
                'rss_url1': 'https://rss.app/feeds/u6rcvfy6PTSf9vQ4.xml',
                'rss_url2': 'https://rss.feedspot.com/uk_car_rss_feeds/'
            }
            self.crew.crew().kickoff(inputs=inputs)

            # Read the final output file
            output_file = os.path.join(self.output_dir, 'ev_news_final.md')
            if not os.path.exists(output_file):
                logger.error("News crew did not generate output file")
                return

            # Read the enriched news data
            enriched_file = os.path.join(self.output_dir, 'ev_news_enriched.json')
            if not os.path.exists(enriched_file):
                logger.error("News crew did not generate enriched news data")
                return

            with open(enriched_file, 'r') as f:
                news_data = json.load(f)

            # Save to database
            await self._save_to_db(news_data)

        except Exception as e:
            logger.error(f"Error running news crew: {str(e)}")
            raise

    async def _save_to_db(self, news_data):
        """Save the news data to the database"""
        async with get_db() as db:
            for article_data in news_data:
                try:
                    # Create a unique GUID from the article URL
                    guid = article_data.get('link', article_data.get('url'))
                    if not guid:
                        continue

                    # Parse the publication date
                    published_str = article_data.get('published')
                    if published_str:
                        try:
                            published_at = parse_date(published_str)
                        except:
                            published_at = datetime.utcnow()
                    else:
                        published_at = datetime.utcnow()

                    # Create article object
                    article = NewsArticle(
                        guid=guid,
                        title=article_data.get('title'),
                        description=article_data.get('summary', ''),
                        content=article_data.get('content', ''),
                        link=article_data.get('link') or article_data.get('url'),
                        category='Technology',  # Default category for news crew articles
                        published_at=published_at
                    )

                    # Check if article already exists
                    from sqlalchemy import select
                    stmt = select(NewsArticle).where(NewsArticle.guid == article.guid)
                    result = await db.execute(stmt)
                    existing = result.scalar_one_or_none()

                    if not existing:
                        logger.info(f"Adding new article from news crew: {article.title}")
                        db.add(article)
                    else:
                        logger.debug(f"Article from news crew already exists: {article.title}")

                except Exception as e:
                    logger.error(f"Error saving article: {str(e)}")
                    continue

            await db.commit()