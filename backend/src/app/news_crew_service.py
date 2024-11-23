import json
import os
from loguru import logger
from datetime import datetime
from dateutil.parser import parse as parse_date
from news_crew.crew import EVNewsWriterCrew
from .database import get_db
from .models import NewsArticle, CrewResult

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

            # Read all output files
            output_files = {
                'parsed': os.path.join(self.output_dir, 'ev_news_parsed.json'),
                'enriched': os.path.join(self.output_dir, 'ev_news_enriched.json'),
                'ranked': os.path.join(self.output_dir, 'ev_news_ranked.json'),
                'final': os.path.join(self.output_dir, 'ev_news_final.md')
            }

            # Check if files exist
            for file_type, file_path in output_files.items():
                if not os.path.exists(file_path):
                    logger.error(f"News crew did not generate {file_type} file")
                    return

            # Read all files
            crew_data = {}
            for file_type, file_path in output_files.items():
                if file_path.endswith('.json'):
                    with open(file_path, 'r') as f:
                        crew_data[file_type] = json.load(f)
                else:
                    with open(file_path, 'r') as f:
                        crew_data[file_type] = f.read()

            # Save to database
            await self._save_to_db(crew_data['enriched'], crew_data)

        except Exception as e:
            logger.error(f"Error running news crew: {str(e)}")
            raise

    async def _save_to_db(self, news_data, crew_data):
        """Save the news data and crew results to the database"""
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
                        await db.flush()  # Flush to get the article ID
                        
                        # Create crew result object
                        crew_result = CrewResult(
                            article_id=article.id,
                            parsed_data=json.dumps(crew_data.get('parsed', [])),
                            enriched_data=json.dumps(crew_data.get('enriched', [])),
                            ranked_data=json.dumps(crew_data.get('ranked', [])),
                            final_content=crew_data.get('final', '')
                        )
                        db.add(crew_result)
                    else:
                        logger.debug(f"Article from news crew already exists: {article.title}")

                except Exception as e:
                    logger.error(f"Error saving article: {str(e)}")
                    continue

            await db.commit()