import asyncio
import os
from gtts import gTTS
from sqlalchemy import select
from app.database import get_db
from app.models import NewsArticle

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "audio")

async def generate_audio_for_article(article_id: int, text: str, audio_type: str) -> str:
    """Generate audio file for an article with specific naming convention"""
    filename = f"{article_id}_{audio_type}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)
    
    # Skip if file already exists
    if os.path.exists(filepath):
        print(f"Audio file {filename} already exists, skipping...")
        return filename
    
    # Generate audio file
    try:
        tts = gTTS(text=text, lang='en')
        tts.save(filepath)
        print(f"Generated {filename}")
        return filename
    except Exception as e:
        print(f"Error generating audio for article {article_id}: {str(e)}")
        return None

async def generate_all_audio():
    """Generate audio files for all articles in the database"""
    # Ensure audio directory exists
    os.makedirs(AUDIO_DIR, exist_ok=True)
    
    try:
        async with get_db() as db:
            # Get all articles
            result = await db.execute(select(NewsArticle))
            articles = result.scalars().all()
            
            print(f"Found {len(articles)} articles")
            
            for article in articles:
                # Generate description audio
                if article.description:
                    await generate_audio_for_article(
                        article.id,
                        article.description,
                        "description"
                    )
                
                # Generate full content audio
                full_text = f"{article.title}. {article.content if article.content else article.description}"
                await generate_audio_for_article(
                    article.id,
                    full_text,
                    "content"
                )
                
    except Exception as e:
        print(f"Error during audio generation: {str(e)}")

if __name__ == "__main__":
    asyncio.run(generate_all_audio())