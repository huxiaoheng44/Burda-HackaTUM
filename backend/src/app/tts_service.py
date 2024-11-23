import os
from gtts import gTTS
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from . import models

class TTSService:
    def __init__(self, audio_dir: str = "audio"):
        self.audio_dir = audio_dir
        os.makedirs(audio_dir, exist_ok=True)
    
    def generate_audio(self, text: str, lang: str = 'en') -> tuple[str, int]:
        """
        Generate audio file from text and return filename and duration
        """
        # Generate unique filename
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(self.audio_dir, filename)
        
        # Generate audio file
        tts = gTTS(text=text, lang=lang)
        tts.save(filepath)
        
        # Get file duration (approximate based on text length)
        # Assuming average speaking rate of 150 words per minute
        words = len(text.split())
        duration_seconds = int((words / 150) * 60)
        
        return filename, duration_seconds
    
    def create_audio_for_article(self, db: Session, article_id: int) -> models.AudioFile:
        """
        Create audio file for a news article
        """
        # Get article
        article = db.query(models.NewsArticle).filter(models.NewsArticle.id == article_id).first()
        if not article:
            raise ValueError(f"Article with id {article_id} not found")
        
        # Generate text for TTS (combine title and content)
        text_content = f"{article.title}. {article.content if article.content else article.description}"
        
        # Generate audio file
        filename, duration = self.generate_audio(text_content)
        
        # Create audio file record
        audio_file = models.AudioFile(
            filename=filename,
            text_content=text_content,
            duration=duration,
            article_id=article_id
        )
        
        db.add(audio_file)
        db.commit()
        db.refresh(audio_file)
        
        return audio_file