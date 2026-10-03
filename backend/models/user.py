from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class User(BaseModel):
    name: str
    password_hash: str
    email: EmailStr
    created_at: datetime

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=8, max_length=32)
    email: EmailStr

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    created_at: datetime

class LoginRequest(BaseModel):
    email: str
    password: str = Field(max_length=32)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse