from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Comment, User, Video
from app.schemas import (
    CommentCreate,
    CommentResponse,
    CommentUpdate
)
from app.security import get_current_user


router = APIRouter(tags=["Comments"])


@router.post(
    "/videos/{video_id}/comments",
    response_model=CommentResponse,
    status_code=201
)
def create_comment(
    video_id: int,
    comment_data: CommentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verificar que el video exista
    video = session.get(Video, video_id)

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video no encontrado"
        )

    # El usuario se obtiene del token JWT
    comment = Comment(
        content=comment_data.content,
        user_id=current_user.id,
        video_id=video_id
    )

    session.add(comment)
    session.commit()
    session.refresh(comment)

    return comment


@router.get(
    "/videos/{video_id}/comments",
    response_model=list[CommentResponse]
)
def get_comments(
    video_id: int,
    session: Session = Depends(get_session)
):
    # Verificar que el video exista
    video = session.get(Video, video_id)

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video no encontrado"
        )

    comments = session.exec(
        select(Comment)
        .where(Comment.video_id == video_id)
        .order_by(Comment.created_at.desc())
    ).all()

    return comments


@router.put(
    "/comments/{comment_id}",
    response_model=CommentResponse
)
def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    comment = session.get(Comment, comment_id)

    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Comentario no encontrado"
        )

    # Solo el autor del comentario puede editarlo
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="No puedes modificar este comentario"
        )

    comment.content = comment_data.content

    session.add(comment)
    session.commit()
    session.refresh(comment)

    return comment


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    comment = session.get(Comment, comment_id)

    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Comentario no encontrado"
        )

    # Solo el autor del comentario puede eliminarlo
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="No puedes eliminar este comentario"
        )

    session.delete(comment)
    session.commit()

    return {
        "message": "Comentario eliminado correctamente"
    }