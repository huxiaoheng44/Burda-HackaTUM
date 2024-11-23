from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, List, Any

class AudioFileResponse(BaseModel):
    id: int
    filename: str
    text_content: str
    duration: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class CrewResultResponse(BaseModel):
    id: int
    parsed_data: Optional[List[Dict[str, Any]]] = None
    enriched_data: Optional[List[Dict[str, Any]]] = None
    ranked_data: Optional[List[Dict[str, Any]]] = None
    final_content: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

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
    audio_file: Optional[AudioFileResponse] = None
    crew_result: Optional[CrewResultResponse] = None
    
    class Config:
        from_attributes = True

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime