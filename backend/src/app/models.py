from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class NewsArticle(Base):
    __tablename__ = "news_articles"
    
    id = Column(Integer, primary_key=True)
    guid = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    content = Column(Text)
    link = Column(String)
    image_url = Column(String)
    category = Column(String)
    published_at = Column(DateTime, index=True)
    views = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    created_at = Column(DateTime, server_default="CURRENT_TIMESTAMP")