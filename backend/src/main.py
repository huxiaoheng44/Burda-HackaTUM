from fastapi import FastAPI, HTTPException, Query
from sqlalchemy import select, text
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional
from loguru import logger
import uvicorn

from app.database import init_db, get_db
from app.models import NewsArticle, AudioFile
from app.schemas import NewsResponse, HealthResponse, AudioFileResponse
from app.feed_fetcher import FeedFetcher
from app.scheduler import setup_scheduler
from app.tts_service import TTSService
from fastapi.responses import FileResponse
import os

# Configure logging
logger.add("logs/api.log", rotation="1 day", retention="7 days")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    await init_db()
    
    # Setup scheduler
    scheduler = setup_scheduler()
    scheduler.start()
    
    yield
    
    # Shutdown scheduler
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/api/news", response_model=List[NewsResponse])
async def get_news(
    category: Optional[str] = None,
    days: Optional[int] = Query(None, ge=1, le=30),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """Get news articles with optional filtering"""
    try:
        async with get_db() as db:
            query = select(NewsArticle)
            
            if category:
                query = query.where(NewsArticle.category == category)
            
            if days:
                date_threshold = datetime.utcnow() - timedelta(days=days)
                query = query.where(NewsArticle.published_at >= date_threshold)
            
            query = query.order_by(NewsArticle.published_at.desc()) \
                        .offset(skip) \
                        .limit(limit)
            
            result = await db.execute(query)
            articles = result.scalars().all()
            
            return [
                NewsResponse(
                    id=article.id,
                    title=article.title,
                    description=article.description,
                    content=article.content,
                    link=article.link,
                    image_url=article.image_url,
                    category=article.category,
                    published_at=article.published_at,
                    views=article.views,
                    shares=article.shares
                )
                for article in articles
            ]
    except Exception as e:
        logger.error(f"Error fetching news: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/news/{article_id}", response_model=NewsResponse)
async def get_article(article_id: int):
    """Get a specific news article by ID"""
    try:
        async with get_db() as db:
            result = await db.execute(
                select(NewsArticle).filter(NewsArticle.id == article_id)
            )
            article = result.scalar_one_or_none()
            
            if not article:
                raise HTTPException(status_code=404, detail="Article not found")
            
            return NewsResponse(
                id=article.id,
                title=article.title,
                description=article.description,
                content=article.content,
                link=article.link,
                image_url=article.image_url,
                category=article.category,
                published_at=article.published_at,
                views=article.views,
                shares=article.shares
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/news/{article_id}/view")
async def increment_views(article_id: int):
    """Increment the view count for an article"""
    try:
        async with get_db() as db:
            result = await db.execute(
                select(NewsArticle).filter(NewsArticle.id == article_id)
            )
            article = result.scalar_one_or_none()
            
            if not article:
                raise HTTPException(status_code=404, detail="Article not found")
            
            article.views += 1
            await db.commit()
            
            return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error incrementing views for article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/news/{article_id}/share")
async def increment_shares(article_id: int):
    """Increment the share count for an article"""
    try:
        async with get_db() as db:
            result = await db.execute(
                select(NewsArticle).filter(NewsArticle.id == article_id)
            )
            article = result.scalar_one_or_none()
            
            if not article:
                raise HTTPException(status_code=404, detail="Article not found")
            
            article.shares += 1
            await db.commit()
            
            return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error incrementing shares for article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/fetch-news")
async def fetch_news():
    """Manually trigger RSS feed fetching"""
    try:
        fetcher = FeedFetcher()
        await fetcher.fetch_all()
        return {"success": True, "message": "Feed fetch completed"}
    except Exception as e:
        logger.error(f"Error during manual feed fetch: {str(e)}")
        raise HTTPException(status_code=500, detail="Feed fetch failed")

@app.post("/generate-all-audio")
async def generate_all_audio():
    """Generate audio for all articles that don't have audio yet"""
    try:
        async with get_db() as db:
            # Get all articles
            result = await db.execute(
                select(NewsArticle)
            )
            articles = result.scalars().all()
            
            tts_service = TTSService()
            generated_count = 0
            
            for article in articles:
                try:
                    # Check if description audio exists
                    desc_result = await db.execute(
                        select(AudioFile).filter(
                            AudioFile.article_id == article.id,
                            AudioFile.type == 'description'
                        )
                    )
                    if not desc_result.scalar_one_or_none():
                        # Generate description audio
                        await tts_service.create_audio_for_article_description(db, article.id)
                        generated_count += 1
                        logger.info(f"Generated description audio for article {article.id}")
                    
                    # Check if full audio exists
                    full_result = await db.execute(
                        select(AudioFile).filter(
                            AudioFile.article_id == article.id,
                            AudioFile.type == 'full'
                        )
                    )
                    if not full_result.scalar_one_or_none():
                        # Generate full audio
                        await tts_service.create_audio_for_article(db, article.id)
                        generated_count += 1
                        logger.info(f"Generated full audio for article {article.id}")
                    
                except Exception as e:
                    logger.error(f"Error generating audio for article {article.id}: {str(e)}")
                    continue
            
            return {
                "success": True,
                "message": f"Generated {generated_count} audio files",
                "total_articles": len(articles)
            }
            
    except Exception as e:
        logger.error(f"Error during audio generation: {str(e)}")
        raise HTTPException(status_code=500, detail="Audio generation failed")

# Initialize TTS service
tts_service = TTSService(audio_dir=os.path.join(os.path.dirname(__file__), "..", "audio"))

@app.post("/api/news/{article_id}/audio", response_model=AudioFileResponse)
async def generate_audio(article_id: int):
    """Generate audio for a news article"""
    try:
        async with get_db() as db:
            # Check if audio already exists
            result = await db.execute(
                select(AudioFile).filter(AudioFile.article_id == article_id)
            )
            existing_audio = result.scalar_one_or_none()
            if existing_audio:
                return existing_audio
            
            # Generate new audio file
            audio_file = await tts_service.create_audio_for_article(db, article_id)
            return audio_file
            
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating audio for article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Audio generation failed")

@app.get("/api/audio/{filename}")
async def get_audio_file(filename: str):
    """Get audio file by filename"""
    try:
        file_path = os.path.join(tts_service.audio_dir, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        return FileResponse(
            file_path,
            media_type="audio/mpeg",
            filename=filename
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving audio file {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error serving audio file")

@app.get("/api/news/{article_id}/audio", response_model=AudioFileResponse)
async def get_article_audio(article_id: int):
    """Get audio metadata for a news article"""
    try:
        async with get_db() as db:
            audio = await tts_service.get_audio_for_article(db, article_id, "content")
            return audio
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error handling audio request for article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/news/description/{article_id}/audio", response_model=AudioFileResponse)
async def get_article_description_audio(article_id: int):
    """Get audio metadata for a news article's description"""
    try:
        async with get_db() as db:
            audio = await tts_service.get_audio_for_article(db, article_id, "description")
            return audio
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error handling description audio request for article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)