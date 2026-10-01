from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str


class Video(SQLModel, table=True):
    __tablename__ = "videos"
    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str
    category: str = Field(default="General")
    video_url: str
    thumbnail_url: str
    views: int = Field(default=0)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class Comment(SQLModel, table=True):
    __tablename__ = "comments"

    id: int | None = Field(default=None, primary_key=True)
    content: str
    user_id: int = Field(foreign_key="users.id")
    video_id: int = Field(foreign_key="videos.id")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )