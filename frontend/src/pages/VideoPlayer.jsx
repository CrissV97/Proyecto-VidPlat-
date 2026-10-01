import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";

import {
    getVideo,
    addView,
    getComments,
    createComment,
    updateComment,
    deleteComment,
    getRecommendedVideos
} from "../api";


function VideoPlayer() {
    const { id } = useParams();

    const [video, setVideo] = useState(null);
    const [comments, setComments] = useState([]);
    const [recommendedVideos, setRecommendedVideos] = useState([]);

    const [commentText, setCommentText] = useState("");

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [commentLoading, setCommentLoading] = useState(false);


    useEffect(() => {
        async function loadVideo() {
            try {
                setLoading(true);
                setError("");

                const videoData = await getVideo(id);

                setVideo(videoData);

                await addView(id);

                const updatedVideo = await getVideo(id);

                setVideo(updatedVideo);

                const commentsData = await getComments(id);

                setComments(commentsData);

                const recommendedData =
                    await getRecommendedVideos(id);

                setRecommendedVideos(
                    recommendedData
                );
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        loadVideo();
    }, [id]);


    async function handleCreateComment(event) {
        event.preventDefault();

        if (!commentText.trim()) {
            return;
        }

        try {
            setCommentLoading(true);

            const newComment = await createComment(
                id,
                commentText
            );

            setComments((previous) => [
                newComment,
                ...previous
            ]);

            setCommentText("");
        } catch (error) {
            setError(error.message);
        } finally {
            setCommentLoading(false);
        }
    }


    function startEditingComment(comment) {
        setEditingCommentId(comment.id);
        setEditingCommentText(comment.content);
    }


    function cancelEditingComment() {
        setEditingCommentId(null);
        setEditingCommentText("");
    }


    async function handleUpdateComment(commentId) {
        if (!editingCommentText.trim()) {
            return;
        }

        try {
            const updatedComment =
                await updateComment(
                    commentId,
                    editingCommentText
                );

            setComments((previous) =>
                previous.map((comment) =>
                    comment.id === commentId
                        ? updatedComment
                        : comment
                )
            );

            cancelEditingComment();
        } catch (error) {
            setError(error.message);
        }
    }


    async function handleDeleteComment(commentId) {
        const confirmed = window.confirm(
            "¿Estás seguro de eliminar este comentario?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteComment(commentId);

            setComments((previous) =>
                previous.filter(
                    (comment) =>
                        comment.id !== commentId
                )
            );
        } catch (error) {
            setError(error.message);
        }
    }


    if (loading) {
        return (
            <>
                <Navbar />

                <main className="video-player-container">
                    <p>Cargando video...</p>
                </main>
            </>
        );
    }


    if (error && !video) {
        return (
            <>
                <Navbar />

                <main className="video-player-container">
                    <p>{error}</p>

                    <Link to="/">
                        Volver al inicio
                    </Link>
                </main>
            </>
        );
    }


    if (!video) {
        return (
            <>
                <Navbar />

                <main className="video-player-container">
                    <p>Video no encontrado.</p>

                    <Link to="/">
                        Volver al inicio
                    </Link>
                </main>
            </>
        );
    }


    return (
        <>
            <Navbar />

            <main className="video-player-container">

                {/* =========================================
                    VIDEO
                ========================================= */}

                <section className="video-main">

                    <video
                        className="video-player"
                        controls
                        src={video.video_url}
                        poster={video.thumbnail_url}
                    >
                        Tu navegador no soporta
                        la reproducción de video.
                    </video>


                    {/* =====================================
                        INFORMACIÓN DEL VIDEO
                    ===================================== */}

                    <div className="video-details">

                        <h1>
                            {video.title}
                        </h1>

                        <p className="video-uploader">
                            {video.uploader}
                        </p>

                        <p className="video-stats">
                            {video.views} vistas
                        </p>

                        <p className="video-date">
                            Publicado el{" "}
                            {new Date(
                                video.created_at
                            ).toLocaleDateString(
                                "es-EC",
                                {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                }
                            )}
                        </p>

                        <div className="video-description">
                            <p>
                                {video.description}
                            </p>
                        </div>

                    </div>


                    {/* =====================================
                        COMENTARIOS
                    ===================================== */}

                    <section className="comments-section">

                        <h2>
                            Comentarios
                        </h2>


                        <form
                            onSubmit={
                                handleCreateComment
                            }
                            className="comment-form"
                        >
                            <textarea
                                value={commentText}
                                onChange={(event) =>
                                    setCommentText(
                                        event.target.value
                                    )
                                }
                                placeholder="Escribe un comentario..."
                                rows="3"
                            />

                            <button
                                type="submit"
                                disabled={
                                    commentLoading
                                }
                            >
                                {commentLoading
                                    ? "Publicando..."
                                    : "Comentar"}
                            </button>
                        </form>


                        {error && (
                            <p className="error-message">
                                {error}
                            </p>
                        )}


                        {comments.length === 0 ? (
                            <p>
                                No hay comentarios todavía.
                            </p>
                        ) : (
                            <div className="comments-list">

                                {comments.map(
                                    (comment) => (
                                        <article
                                            key={
                                                comment.id
                                            }
                                            className="comment"
                                        >

                                            {editingCommentId ===
                                            comment.id ? (
                                                <div>

                                                    <textarea
                                                        value={
                                                            editingCommentText
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setEditingCommentText(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        rows="3"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleUpdateComment(
                                                                comment.id
                                                            )
                                                        }
                                                    >
                                                        Guardar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            cancelEditingComment
                                                        }
                                                    >
                                                        Cancelar
                                                    </button>

                                                </div>
                                            ) : (
                                                <>
                                                    <p>
                                                        {
                                                            comment.content
                                                        }
                                                    </p>

                                                    <small>
                                                        Publicado el{" "}
                                                        {new Date(
                                                            comment.created_at
                                                        ).toLocaleDateString(
                                                            "es-EC"
                                                        )}
                                                    </small>

                                                    <div className="comment-actions">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                startEditingComment(
                                                                    comment
                                                                )
                                                            }
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteComment(
                                                                    comment.id
                                                                )
                                                            }
                                                        >
                                                            Eliminar
                                                        </button>

                                                    </div>
                                                </>
                                            )}

                                        </article>
                                    )
                                )}

                            </div>
                        )}

                    </section>

                </section>


                {/* =========================================
                    RECOMENDACIONES
                ========================================= */}

                <aside className="recommended-section">

                    <h2>
                        Videos recomendados
                    </h2>

                    {recommendedVideos.length ===
                    0 ? (
                        <p>
                            No hay videos recomendados.
                        </p>
                    ) : (
                        <div className="recommended-list">

                            {recommendedVideos.map(
                                (recommendedVideo) => (
                                    <Link
                                        key={
                                            recommendedVideo.id
                                        }
                                        to={`/video/${recommendedVideo.id}`}
                                        className="recommended-video"
                                    >

                                        <img
                                            src={
                                                recommendedVideo.thumbnail_url
                                            }
                                            alt={
                                                recommendedVideo.title
                                            }
                                        />

                                        <div>
                                            <h3>
                                                {
                                                    recommendedVideo.title
                                                }
                                            </h3>

                                            <p>
                                                {
                                                    recommendedVideo.uploader
                                                }
                                            </p>

                                            <small>
                                                {
                                                    recommendedVideo.views
                                                }{" "}
                                                vistas
                                            </small>
                                        </div>

                                    </Link>
                                )
                            )}

                        </div>
                    )}

                </aside>

            </main>
        </>
    );
}


export default VideoPlayer;