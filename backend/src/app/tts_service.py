import os
from gtts import gTTS
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import models

class TTSService:
    def __init__(self, audio_dir: str = "audio"):
        self.audio_dir = audio_dir
        os.makedirs(audio_dir, exist_ok=True)
    
    def get_audio_filename(self, article_id: int, audio_type: str) -> str:
        """Get the standardized audio filename"""
        return f"{article_id}_{audio_type}.mp3"

    def get_audio_duration(self, text: str) -> int:
        """Calculate approximate audio duration based on text length"""
        words = len(text.split())
        return int((words / 150) * 60)  # Assuming 150 words per minute

    def check_audio_exists(self, article_id: int, audio_type: str) -> tuple[str, int]:
        """Check if audio file exists and return filename and duration"""
        filename = self.get_audio_filename(article_id, audio_type)
        filepath = os.path.join(self.audio_dir, filename)
        
        if not os.path.exists(filepath):
            return None, 0
            
        # Calculate duration from text length
        if audio_type == "description":
            text = article.description
        else:  # content
            text = f"{article.title}. {article.content if article.content else article.description}"
            
        duration = self.get_audio_duration(text)
        return filename, duration
    
    async def get_audio_for_article(self, db: AsyncSession, article_id: int, audio_type: str = "content") -> models.AudioFile:
        """Get audio metadata for an article"""
        # Get article
        result = await db.execute(
            select(models.NewsArticle).filter(models.NewsArticle.id == article_id)
        )
        article = result.scalar_one_or_none()
        if not article:
            raise ValueError(f"Article with id {article_id} not found")
        
        # Get text content based on type
        if audio_type == "description":
            text_content = article.description if article.description else "No description available."
        else:  # content
            text_content = f"{article.title}. {article.content if article.content else article.description}"
        
        # Get filename and duration
        filename = self.get_audio_filename(article_id, audio_type)
        duration = self.get_audio_duration(text_content)
        
        # Create or get audio file record
        result = await db.execute(
            select(models.AudioFile).filter(
                models.AudioFile.article_id == article_id,
                models.AudioFile.type == audio_type
            )
        )
        audio_file = result.scalar_one_or_none()
        
        if not audio_file:
            audio_file = models.AudioFile(
                filename=filename,
                text_content=text_content,
                duration=duration,
                article_id=article_id,
                type=audio_type
            )
            db.add(audio_file)
            await db.commit()
            await db.refresh(audio_file)
        
        return audio_file