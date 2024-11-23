from fastapi import FastAPI, HTTPException, Query
from sqlalchemy import select
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional
from loguru import logger
import uvicorn

from app.database import init_db, get_db
from app.models import NewsArticle, AudioFile, CrewResult
from app.schemas import NewsResponse, HealthResponse, AudioFileResponse, CrewResultResponse
import json
from app.feed_fetcher import FeedFetcher
from app.scheduler import setup_scheduler
from app.tts_service import TTSService
from app.news_crew_service import NewsCrewService
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
                    shares=article.shares,
                    crew_result=CrewResultResponse(
                        id=article.crew_result.id,
                        parsed_data=json.loads(article.crew_result.parsed_data) if article.crew_result and article.crew_result.parsed_data else None,
                        enriched_data=json.loads(article.crew_result.enriched_data) if article.crew_result and article.crew_result.enriched_data else None,
                        ranked_data=json.loads(article.crew_result.ranked_data) if article.crew_result and article.crew_result.ranked_data else None,
                        final_content=article.crew_result.final_content,
                        created_at=article.crew_result.created_at
                    ) if article.crew_result else None
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
                shares=article.shares,
                crew_result=CrewResultResponse(
                    id=article.crew_result.id,
                    parsed_data=json.loads(article.crew_result.parsed_data) if article.crew_result and article.crew_result.parsed_data else None,
                    enriched_data=json.loads(article.crew_result.enriched_data) if article.crew_result and article.crew_result.enriched_data else None,
                    ranked_data=json.loads(article.crew_result.ranked_data) if article.crew_result and article.crew_result.ranked_data else None,
                    final_content=article.crew_result.final_content,
                    created_at=article.crew_result.created_at
                ) if article.crew_result else None
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

@app.post("/api/news/{article_id}/generate-crew")
async def generate_crew_content(article_id: int):
    """Generate or retrieve crew content for a news article"""
    try:
        async with get_db() as db:
            # Check if crew result already exists
            result = await db.execute(
                select(CrewResult).filter(CrewResult.article_id == article_id)
            )
            existing_crew = result.scalar_one_or_none()
            if existing_crew:
                return CrewResultResponse(
                    id=existing_crew.id,
                    parsed_data=json.loads(existing_crew.parsed_data) if existing_crew.parsed_data else None,
                    enriched_data=json.loads(existing_crew.enriched_data) if existing_crew.enriched_data else None,
                    ranked_data=json.loads(existing_crew.ranked_data) if existing_crew.ranked_data else None,
                    final_content=existing_crew.final_content,
                    created_at=existing_crew.created_at
                )
            
            # Generate new crew content
            crew_service = NewsCrewService()
            await crew_service.run_crew()
            
            # Get the newly created crew result
            result = await db.execute(
                select(CrewResult).filter(CrewResult.article_id == article_id)
            )
            crew = result.scalar_one_or_none()
            if not crew:
                raise HTTPException(status_code=404, detail="Failed to generate crew content")
            
            return CrewResultResponse(
                id=crew.id,
                parsed_data=json.loads(crew.parsed_data) if crew.parsed_data else None,
                enriched_data=json.loads(crew.enriched_data) if crew.enriched_data else None,
                ranked_data=json.loads(crew.ranked_data) if crew.ranked_data else None,
                final_content=crew.final_content,
                created_at=crew.created_at
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating crew content for article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate crew content")

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

@app.get("/api/news/{article_id}/crew", response_model=CrewResultResponse)
async def get_article_crew_result(article_id: int):
    """Get crew results for a news article"""
    try:
        async with get_db() as db:
            result = await db.execute(
                select(CrewResult).filter(CrewResult.article_id == article_id)
            )
            crew_result = result.scalar_one_or_none()
            
            if not crew_result:
                raise HTTPException(status_code=404, detail="Crew result not found")
            
            return CrewResultResponse(
                id=crew_result.id,
                parsed_data=json.loads(crew_result.parsed_data) if crew_result.parsed_data else None,
                enriched_data=json.loads(crew_result.enriched_data) if crew_result.enriched_data else None,
                ranked_data=json.loads(crew_result.ranked_data) if crew_result.ranked_data else None,
                final_content=crew_result.final_content,
                created_at=crew_result.created_at
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching crew result for article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/news/{article_id}/audio", response_model=AudioFileResponse)
async def get_article_audio(article_id: int):
    """Get or generate audio metadata for a news article"""
    try:
        async with get_db() as db:
            # Try to get existing audio
            result = await db.execute(
                select(AudioFile).filter(AudioFile.article_id == article_id)
            )
            audio = result.scalar_one_or_none()
            
            if audio:
                return audio
            
            # If no audio exists, generate it
            try:
                audio = await tts_service.create_audio_for_article(db, article_id)
                return audio
            except ValueError as e:
                raise HTTPException(status_code=404, detail=str(e))
            except Exception as e:
                logger.error(f"Error generating audio for article {article_id}: {str(e)}")
                raise HTTPException(status_code=500, detail="Audio generation failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling audio request for article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)