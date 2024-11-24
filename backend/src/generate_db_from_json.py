import os
import json
import asyncio
import aiohttp
import uuid
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from datetime import datetime
from app.database import init_db, get_db
from app.models import NewsArticle
from sqlalchemy import text

# OpenAI DALL-E API 配置
OPENAI_API_ENDPOINT = "https://api.openai.com/v1/images/generations"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not set in the environment variables")

# 相对路径设置
IMG_DIR = "img"
os.makedirs(IMG_DIR, exist_ok=True)  # 确保 img 目录存在

# Function to parse and validate `published_at`
def parse_published_at(date_str):
    if not date_str:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(date_str.replace("Z", ""))
    except ValueError:
        pass
    try:
        return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        pass
    return datetime.utcnow()


# Asynchronous function to generate an image using OpenAI DALL-E API
async def generate_image_from_description(description, output_dir):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    payload = {
        "prompt": description or "Default prompt: a beautiful landscape",
        "n": 1,
        "size": "1024x1024"
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(OPENAI_API_ENDPOINT, headers=headers, json=payload) as response:
                if response.status != 200:
                    print(f"Error generating image: {response.status}, {await response.text()}")
                    return None
                
                response_data = await response.json()
                if "data" not in response_data or len(response_data["data"]) == 0:
                    print("No image data returned from OpenAI API.")
                    return None
                
                image_url = response_data["data"][0]["url"]

                # 下载图片
                unique_id = str(uuid.uuid4())  # 使用 UUID 生成唯一文件名
                image_name = f"{unique_id}.png"  # 文件名
                image_path = os.path.join(output_dir, image_name)  # img/<filename>
                async with session.get(image_url) as img_response:
                    img_data = await img_response.read()
                    with open(image_path, "wb") as img_file:
                        img_file.write(img_data)

                # 返回相对路径，强制使用 `/` 分隔符
                return f"/img/{image_name}".replace("\\", "/")  # 确保路径格式一致
    except Exception as e:
        print(f"Error generating image: {e}")
        return None


# Function to store articles in the database
async def store_articles_in_db(json_file_path):
    await init_db()

    try:
        with open(json_file_path, "r", encoding="utf-8") as file:
            json_data = json.load(file)
    except FileNotFoundError:
        print(f"Error: JSON file not found at {json_file_path}")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Failed to parse JSON file: {e}")
        return

    async with get_db() as session:
        try:
            for article in json_data:
                # 使用 UUID 确保唯一性
                guid = str(uuid.uuid4())
                published_at = parse_published_at(article.get("published_at"))
                description = article.get("description", "No description provided.")

                # 检查是否已有相同标题和发布时间的记录
                existing_article = await session.execute(
                    text("SELECT id FROM news_articles WHERE title = :title AND published_at = :published_at"),
                    {"title": article["title"], "published_at": published_at}
                )
                if existing_article.fetchone():
                    print(f"Skipping duplicate article: {article['title']}")
                    continue

                # 生成图片
                image_path = await generate_image_from_description(description, IMG_DIR)

                # 如果图片生成失败，跳过
                if not image_path:
                    print(f"Skipping article {guid} due to image generation failure")
                    continue

                # 创建 NewsArticle 实例并添加到会话
                news_article = NewsArticle(
                    guid=guid,
                    title=article["title"],
                    description=description,
                    content=article.get("content"),
                    link=article.get("link"),
                    image_url=image_path,  # 存储相对路径，格式为 /img/<filename>
                    category=article.get("category", None),
                    published_at=published_at
                )

                try:
                    session.add(news_article)
                    print(f"Article added: {article['title']}")
                except IntegrityError as e:
                    print(f"Error inserting article {guid}: {e}")
                    await session.rollback()

            # 提交事务
            print("Committing articles to the database...")
            await session.commit()
            print("Articles saved successfully!")

        except SQLAlchemyError as e:
            print(f"Database error: {e}")
            await session.rollback()
        except Exception as e:
            print(f"Unexpected error: {e}")
            await session.rollback()


# Default file path
JSON_FILE_PATH = os.path.join("news_data.json")  # JSON 文件在同一目录

# Run the script
if __name__ == "__main__":
    print(f"Reading from JSON file: {JSON_FILE_PATH}")
    asyncio.run(store_articles_in_db(JSON_FILE_PATH))
