from fastapi import FastAPI, HTTPException, Query
from sqlalchemy import select
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional
from loguru import logger
import uvicorn

from app.database import init_db, get_db
from app.models import NewsArticle
from app.schemas import NewsResponse, HealthResponse
from app.feed_fetcher import FeedFetcher
from app.scheduler import setup_scheduler

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
            article = await db.query(NewsArticle) \
                            .filter(NewsArticle.id == article_id) \
                            .first()
            
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
            article = await db.query(NewsArticle) \
                            .filter(NewsArticle.id == article_id) \
                            .first()
            
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
            article = await db.query(NewsArticle) \
                            .filter(NewsArticle.id == article_id) \
                            .first()
            
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)