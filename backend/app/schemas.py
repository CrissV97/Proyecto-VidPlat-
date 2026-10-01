from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ============================================================
# USUARIOS
# ============================================================

class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# AUTENTICACIÓN
# ============================================================

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int


# ============================================================
# VIDEOS
# ============================================================

class VideoCreate(BaseModel):
    title: str
    description: str
    video_url: str
    thumbnail_url: str


class VideoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    video_url: str | None = None
    thumbnail_url: str | None = None


class VideoResponse(BaseModel):
    id: int
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    views: int
    user_id: int
    uploader: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# COMENTARIOS
# ============================================================

class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    content: str
    user_id: int
    video_id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )