from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from loguru import logger

from .models import Base
from .config import DATABASE_URL

engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True only in development
    future=True
)

async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database initialized successfully")
    except SQLAlchemyError as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise

@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session = async_session()
    try:
        yield session
        await session.commit()
    except SQLAlchemyError as e:
        await session.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Unexpected error during database operation: {str(e)}")
        raise
    finally:
        await session.close()