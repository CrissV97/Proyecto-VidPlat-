from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.routers import auth, comments, users, videos


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="VidPlat API",
    description="API REST para plataforma de videos",
    version="1.0.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(users.router)
app.include_router(auth.router)
app.include_router(videos.router)
app.include_router(comments.router)


@app.get("/")
def root():
    return {
        "message": "VidPlat API funcionando",
        "docs": "/docs"
    }