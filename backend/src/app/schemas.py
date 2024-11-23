from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NewsResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    link: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    published_at: datetime
    views: int
    shares: int
    
    class Config:
        from_attributes = True

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime