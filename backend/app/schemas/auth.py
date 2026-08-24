from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    email: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: Optional[str] = ""


class PrototypeLogin(BaseModel):
    email: str
    role: Optional[str] = "INVESTIGATOR"
    full_name: Optional[str] = None
    password: Optional[str] = ""


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "VIEWER"


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
