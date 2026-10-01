import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";

import {
  getVideo,
  addView,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  getRecommendedVideos,
  getUserId,
} from "../services/api";

function VideoPlayer() {
  const { id } = useParams();
  const viewRegisteredRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [recommendedVideos, setRecommendedVideos] = useState([]);

  const [commentText, setCommentText] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentLoading, setCommentLoading] = useState(false);

  const currentUserId = getUserId();

  useEffect(() => {
    async function loadVideo() {
      try {
        setLoading(true);
        setError("");

        const videoData = await getVideo(id);
        setVideo(videoData);

        try {
          if (viewRegisteredRef.current !== id) {
            viewRegisteredRef.current = id;

            await addView(id);

            const updatedVideo = await getVideo(id);
            setVideo(updatedVideo);
          }
        } catch (viewError) {
          console.error("No se pudo registrar la vista:", viewError);
        }

        const commentsData = await getComments(id);
        setComments(commentsData);

        const recommendedData = await getRecommendedVideos(id);

        setRecommendedVideos(recommendedData);
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
      setError("");

      const newComment = await createComment(id, commentText.trim());

      setComments((previous) => [newComment, ...previous]);

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
      setError("");

      const updatedComment = await updateComment(
        commentId,
        editingCommentText.trim(),
      );

      setComments((previous) =>
        previous.map((comment) =>
          comment.id === commentId ? updatedComment : comment,
        ),
      );

      cancelEditingComment();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDeleteComment(commentId) {
    const confirmed = window.confirm(
      "¿Estás seguro de eliminar este comentario?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteComment(commentId);

      setComments((previous) =>
        previous.filter((comment) => comment.id !== commentId),
      );
    } catch (error) {
      setError(error.message);
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatCommentDate(date) {
    return new Date(date).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="video-page">
          <div className="video-loading">
            <div className="loading-spinner"></div>
            <p>Cargando video...</p>
          </div>
        </main>
      </>
    );
  }

  if (error && !video) {
    return (
      <>
        <Navbar />

        <main className="video-page">
          <div className="video-error">
            <div className="error-icon">!</div>

            <h2>No se pudo cargar el video</h2>

            <p>{error}</p>

            <Link to="/" className="back-home-button">
              Volver al inicio
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Navbar />

        <main className="video-page">
          <div className="video-error">
            <div className="error-icon">!</div>

            <h2>Video no encontrado</h2>

            <p>El video que buscas no existe o ya no está disponible.</p>

            <Link to="/" className="back-home-button">
              Volver al inicio
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="video-page">
        <div className="video-layout">
          {/* COLUMNA PRINCIPAL */}

          <section className="video-main-column">
            <div className="video-player-wrapper">
              <video
                className="video-player"
                controls
                src={video.video_url}
                poster={video.thumbnail_url}
              >
                Tu navegador no soporta la reproducción de video.
              </video>
            </div>

            <div className="video-information">
              <h1 className="video-title">{video.title}</h1>

              <span className="video-player-category">
                {video.category || "General"}
              </span>

              <div className="video-meta">
                <div className="uploader-info">
                  <div className="uploader-avatar">
                    {video.uploader?.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{video.uploader}</strong>

                    <span>Publicado el {formatDate(video.created_at)}</span>
                  </div>
                </div>

                <div className="video-view-count">
                  <span className="view-icon">▶</span>
                  {video.views} vistas
                </div>
              </div>

              <div className="video-description">
                <h3>Descripción</h3>

                <p>{video.description}</p>
              </div>
            </div>

            {/* COMENTARIOS */}

            <section className="comments-section">
              <div className="section-heading">
                <h2>Comentarios</h2>

                <span className="comment-count">{comments.length}</span>
              </div>

              <form onSubmit={handleCreateComment} className="comment-form">
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Escribe un comentario..."
                  rows="3"
                />

                <div className="comment-form-footer">
                  <span>Comparte tu opinión</span>

                  <button
                    type="submit"
                    disabled={commentLoading || !commentText.trim()}
                    className="primary-button"
                  >
                    {commentLoading ? "Publicando..." : "Comentar"}
                  </button>
                </div>
              </form>

              {error && <div className="error-message">{error}</div>}

              {comments.length === 0 ? (
                <div className="empty-comments">
                  <div className="empty-comments-icon">💬</div>

                  <h3>No hay comentarios todavía</h3>

                  <p>Sé el primero en comentar este video.</p>
                </div>
              ) : (
                <div className="comments-list">
                  {comments.map((comment) => (
                    <article key={comment.id} className="comment-card">
                      <div className="comment-avatar">
                        {(comment.user_name || `Usuario ${comment.user_id}`)
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="comment-content">
                        <div className="comment-header">
                          <strong>
                            {comment.user_name || `Usuario ${comment.user_id}`}
                          </strong>

                          <small>{formatCommentDate(comment.created_at)}</small>
                        </div>

                        {editingCommentId === comment.id ? (
                          <div className="comment-edit-area">
                            <textarea
                              value={editingCommentText}
                              onChange={(event) =>
                                setEditingCommentText(event.target.value)
                              }
                              rows="3"
                            />

                            <div className="comment-edit-buttons">
                              <button
                                type="button"
                                className="primary-button small-button"
                                onClick={() => handleUpdateComment(comment.id)}
                              >
                                Guardar
                              </button>

                              <button
                                type="button"
                                className="secondary-button small-button"
                                onClick={cancelEditingComment}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="comment-text">{comment.content}</p>

                            {String(comment.user_id) ===
                              String(currentUserId) && (
                              <div className="comment-actions">
                                <button
                                  type="button"
                                  onClick={() => startEditingComment(comment)}
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>

          {/* VIDEOS RECOMENDADOS */}

          <aside className="recommended-section">
            <div className="recommended-heading">
              <h2>Videos recomendados</h2>

              <span>Para ti</span>
            </div>

            {recommendedVideos.length === 0 ? (
              <div className="no-recommended">
                <div>🎬</div>

                <p>No hay videos recomendados todavía.</p>
              </div>
            ) : (
              <div className="recommended-list">
                {recommendedVideos.map((recommendedVideo) => (
                  <Link
                    key={recommendedVideo.id}
                    to={`/video/${recommendedVideo.id}`}
                    className="recommended-video"
                  >
                    <div className="recommended-thumbnail-container">
                      <img
                        src={recommendedVideo.thumbnail_url}
                        alt={recommendedVideo.title}
                        className="recommended-thumbnail"
                      />

                      <span className="recommended-play">▶</span>
                    </div>

                    <div className="recommended-info">
                      <h3>{recommendedVideo.title}</h3>

                      <p>{recommendedVideo.uploader}</p>

                      <span>{recommendedVideo.views} vistas</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}

export default VideoPlayer;
