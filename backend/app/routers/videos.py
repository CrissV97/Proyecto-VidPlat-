from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.database import get_session
from app.models import User, Video
from app.schemas import VideoCreate, VideoResponse, VideoUpdate
from app.security import get_current_user

from app.s3_service import (
    generate_video_upload_url,
    generate_thumbnail_upload_url,
    get_video_url,
    get_thumbnail_url,
    delete_video_object,
    delete_thumbnail_object,
    object_exists,
    S3_VIDEO_BUCKET,
    S3_THUMBNAIL_BUCKET
)


router = APIRouter(
    prefix="/videos",
    tags=["Videos"]
)


# ============================================================
# SCHEMAS PARA SUBIDA A S3
# ============================================================

class UploadRequest(BaseModel):
    filename: str
    content_type: str


# ============================================================
# TIPOS DE ARCHIVO PERMITIDOS
# ============================================================

ALLOWED_VIDEO_TYPES = {
    "video/mp4"
}

ALLOWED_THUMBNAIL_TYPES = {
    "image/jpeg",
    "image/png"
}


# ============================================================
# SERIALIZAR VIDEO
# ============================================================

def serialize_video(video: Video, uploader_name: str) -> dict:
    return {
        "id": video.id,
        "title": video.title,
        "description": video.description,
        "category": video.category,
        "video_url": get_video_url(video.video_url),
        "thumbnail_url": get_thumbnail_url(video.thumbnail_url),
        "views": video.views,
        "user_id": video.user_id,
        "uploader": uploader_name,
        "created_at": video.created_at
    }


# ============================================================
# GENERAR URL PARA SUBIR VIDEO
# ============================================================

@router.post("/upload-video-url")
def create_video_upload_url(
    upload_data: UploadRequest,
    current_user: User = Depends(get_current_user)
):
    if upload_data.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400,
            detail="El video debe estar en formato MP4"
        )

    if not upload_data.filename.lower().endswith(".mp4"):
        raise HTTPException(
            status_code=400,
            detail="El archivo de video debe tener extensión .mp4"
        )

    return generate_video_upload_url(
        filename=upload_data.filename,
        content_type=upload_data.content_type
    )


# ============================================================
# GENERAR URL PARA SUBIR MINIATURA
# ============================================================

@router.post("/upload-thumbnail-url")
def create_thumbnail_upload_url(
    upload_data: UploadRequest,
    current_user: User = Depends(get_current_user)
):
    if upload_data.content_type not in ALLOWED_THUMBNAIL_TYPES:
        raise HTTPException(
            status_code=400,
            detail="La miniatura debe ser JPG, JPEG o PNG"
        )

    valid_extensions = (
        ".jpg",
        ".jpeg",
        ".png"
    )

    if not upload_data.filename.lower().endswith(
        valid_extensions
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "La miniatura debe tener extensión "
                "JPG, JPEG o PNG"
            )
        )

    return generate_thumbnail_upload_url(
        filename=upload_data.filename,
        content_type=upload_data.content_type
    )


# ============================================================
# CREAR VIDEO
# ============================================================

@router.post(
    "",
    response_model=VideoResponse,
    status_code=201
)
def create_video(
    video_data: VideoCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verificar que el video exista en S3
    if not object_exists(
        S3_VIDEO_BUCKET,
        video_data.video_url
    ):
        raise HTTPException(
            status_code=400,
            detail="El archivo de video no existe en S3"
        )

    # Verificar que la miniatura exista en S3
    if not object_exists(
        S3_THUMBNAIL_BUCKET,
        video_data.thumbnail_url
    ):
        raise HTTPException(
            status_code=400,
            detail="La miniatura no existe en S3"
        )

    video = Video(
    title=video_data.title,
    description=video_data.description,
    category=video_data.category,
    video_url=video_data.video_url,
    thumbnail_url=video_data.thumbnail_url,
    user_id=current_user.id,
    views=0
)

    session.add(video)
    session.commit()
    session.refresh(video)

    return serialize_video(
        video,
        current_user.name
    )


# ============================================================
# OBTENER TODOS LOS VIDEOS
# ============================================================

@router.get(
    "",
    response_model=list[VideoResponse]
)
def get_videos(
    session: Session = Depends(get_session)
):
    results = session.exec(
        select(Video, User)
        .join(
            User,
            User.id == Video.user_id
        )
        .order_by(
            Video.created_at.desc()
        )
    ).all()

    return [
        serialize_video(
            video,
            user.name
        )
        for video, user in results
    ]


# ============================================================
# VIDEOS RECOMENDADOS
# ============================================================

@router.get(
    "/recommended/{video_id}",
    response_model=list[VideoResponse]
)
def recommended_videos(
    video_id: int,
    session: Session = Depends(get_session)
):
    video = session.get(
        Video,
        video_id
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video no encontrado"
        )

    results = session.exec(
        select(Video, User)
        .join(
            User,
            User.id == Video.user_id
        )
        .where(
            Video.id != video_id
        )
        .order_by(
            Video.views.desc()
        )
        .limit(10)
    ).all()

    return [
        serialize_video(
            video,
            user.name
        )
        for video, user in results
    ]


# ============================================================
# OBTENER VIDEO POR ID
# ============================================================

@router.get(
    "/{video_id}",
    response_model=VideoResponse
)
def get_video(
    video_id: int,
    session: Session = Depends(get_session)
):
    result = session.exec(
        select(Video, User)
        .join(
            User,
            User.id == Video.user_id
        )
        .where(
            Video.id == video_id
        )
    ).first()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Video no encontrado"
        )

    video, user = result

    return serialize_video(
        video,
        user.name
    )


# ============================================================
# ACTUALIZAR VIDEO
# ============================================================

@router.put(
    "/{video_id}",
    response_model=VideoResponse
)
def update_video(
    video_id: int,
    video_data: VideoUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    video = session.get(
        Video,
        video_id
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video no encontrado"
        )

    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="No puedes modificar este video"
        )

    old_video_key = video.video_url
    old_thumbnail_key = video.thumbnail_url

    update_data = video_data.model_dump(
        exclude_unset=True
    )

    # Verificar nuevo video
    if "video_url" in update_data:
        new_video_key = update_data["video_url"]

        if not object_exists(
            S3_VIDEO_BUCKET,
            new_video_key
        ):
            raise HTTPException(
                status_code=400,
                detail="El nuevo video no existe en S3"
            )

    # Verificar nueva miniatura
    if "thumbnail_url" in update_data:
        new_thumbnail_key = update_data[
            "thumbnail_url"
        ]

        if not object_exists(
            S3_THUMBNAIL_BUCKET,
            new_thumbnail_key
        ):
            raise HTTPException(
                status_code=400,
                detail="La nueva miniatura no existe en S3"
            )

    for key, value in update_data.items():
        setattr(
            video,
            key,
            value
        )

    session.add(video)
    session.commit()
    session.refresh(video)

    # Eliminar archivo anterior
    if (
        "video_url" in update_data
        and old_video_key != video.video_url
    ):
        delete_video_object(
            old_video_key
        )

    if (
        "thumbnail_url" in update_data
        and old_thumbnail_key != video.thumbnail_url
    ):
        delete_thumbnail_object(
            old_thumbnail_key
        )

    return serialize_video(
        video,
        current_user.name
    )


# ============================================================
# ELIMINAR VIDEO
# ============================================================

@router.delete(
    "/{video_id}"
)
def delete_video(
    video_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    video = session.get(
        Video,
        video_id
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video no encontrado"
        )

    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="No puedes eliminar este video"
        )

    video_key = video.video_url
    thumbnail_key = video.thumbnail_url

    session.delete(video)
    session.commit()

    # Eliminar archivos de S3
    delete_video_object(
        video_key
    )

    delete_thumbnail_object(
        thumbnail_key
    )

    return {
        "message": "Video eliminado correctamente"
    }


# ============================================================
# AUMENTAR VISTAS
# ============================================================

@router.post(
    "/{video_id}/view"
)
def add_view(
    video_id: int,
    session: Session = Depends(get_session)
):
    video = session.get(
        Video,
        video_id
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video no encontrado"
        )

    video.views += 1

    session.add(video)
    session.commit()
    session.refresh(video)

    return {
        "video_id": video.id,
        "views": video.views
    }