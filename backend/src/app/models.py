from sqlalchemy import Column, Integer, String, DateTime, Text, func, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class AudioFile(Base):
    __tablename__ = "audio_files"
    
    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    text_content = Column(Text, nullable=False)
    duration = Column(Integer)  # Duration in seconds
    article_id = Column(Integer, ForeignKey('news_articles.id'))
    created_at = Column(DateTime, server_default=func.now())
    
    article = relationship("NewsArticle", back_populates="audio_file")

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
    created_at = Column(DateTime, server_default=func.now())
    
    audio_file = relationship("AudioFile", back_populates="article", uselist=False)
    crew_result = relationship("CrewResult", back_populates="article", uselist=False)

class CrewResult(Base):
    __tablename__ = "crew_results"
    
    id = Column(Integer, primary_key=True)
    article_id = Column(Integer, ForeignKey('news_articles.id'))
    parsed_data = Column(JSON)  # From ev_news_parsed.json
    enriched_data = Column(JSON)  # From ev_news_enriched.json
    ranked_data = Column(JSON)  # From ev_news_ranked.json
    final_content = Column(Text)  # From ev_news_final.md
    created_at = Column(DateTime, server_default=func.now())
    
    article = relationship("NewsArticle", back_populates="crew_result")