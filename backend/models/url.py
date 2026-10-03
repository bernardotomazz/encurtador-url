from pydantic import BaseModel, HttpUrl
from datetime import datetime

class URL(BaseModel):
    original_url: str
    short_url: str
    user_id: str | None 
    clicks: int = 0
    created_at: datetime
    last_click_at: datetime | None = None


class OriginalURL(BaseModel):
    original_url: HttpUrl

class UpdateURL(BaseModel):
    original_url: HttpUrl

class CreateURLResponse(BaseModel):
    original_url: str
    short_url: str
    clicks: int = 0
    created_at: datetime
    