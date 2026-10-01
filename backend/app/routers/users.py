from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import User, Video
from app.schemas import (
    UserCreate,
    UserResponse,
    UserUpdate,
    VideoResponse
)
from app.security import (
    get_current_user,
    hash_password
)

from app.s3_service import (
    get_video_url,
    get_thumbnail_url
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ============================================================
# CREAR USUARIO
# ============================================================

@router.post(
    "",
    response_model=UserResponse,
    status_code=201
)
def create_user(
    user_data: UserCreate,
    session: Session = Depends(get_session)
):
    existing_user = session.exec(
        select(User).where(
            User.email == user_data.email
        )
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="El correo ya está registrado"
        )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(
            user_data.password
        )
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return new_user


# ============================================================
# OBTENER USUARIO
# ============================================================

@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(
    user_id: int,
    session: Session = Depends(get_session)
):
    user = session.get(
        User,
        user_id
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return user


# ============================================================
# ACTUALIZAR USUARIO
# ============================================================

@router.put(
    "/{user_id}",
    response_model=UserResponse
)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="No puedes modificar este usuario"
        )

    user = session.get(
        User,
        user_id
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    # Verificar correo
    if user_data.email is not None:
        existing_user = session.exec(
            select(User).where(
                User.email == user_data.email,
                User.id != user_id
            )
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="El correo ya está registrado"
            )

        user.email = user_data.email

    # Actualizar nombre
    if user_data.name is not None:
        user.name = user_data.name

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


# ============================================================
# OBTENER VIDEOS DEL USUARIO
# ============================================================

@router.get(
    "/{user_id}/videos",
    response_model=list[VideoResponse]
)
def get_user_videos(
    user_id: int,
    session: Session = Depends(get_session)
):
    # Verificar que el usuario exista
    user = session.get(
        User,
        user_id
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    # Obtener los videos del usuario
    videos = session.exec(
        select(Video)
        .where(
            Video.user_id == user_id
        )
        .order_by(
            Video.created_at.desc()
        )
    ).all()

    # Convertir los videos al formato de respuesta
    return [
        {
            "id": video.id,
            "title": video.title,
            "description": video.description,
            "video_url": get_video_url(
                video.video_url
            ),
            "thumbnail_url": get_thumbnail_url(
                video.thumbnail_url
            ),
            "views": video.views,
            "user_id": video.user_id,
            "uploader": user.name,
            "created_at": video.created_at
        }
        for video in videos
    ]