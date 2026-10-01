import { useEffect, useRef, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";

import {
  getUser,
  getUserVideos,
  uploadVideoFiles,
  createVideo,
  updateVideo,
  deleteVideo,
  getToken,
} from "../services/api";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState("General");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        if (!getToken()) {
          navigate("/login");
          return;
        }

        const userData = await getUser(id);
        const videosData = await getUserVideos(id);

        setUser(userData);
        setVideos(videosData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [id, navigate]);

  function handleVideoFileChange(event) {
    const file = event.target.files[0];

    if (!file) {
      setVideoFile(null);
      return;
    }

    if (file.type !== "video/mp4") {
      setError("El video debe estar en formato MP4.");
      setVideoFile(null);
      return;
    }

    setError("");
    setVideoFile(file);
  }

  function handleThumbnailFileChange(event) {
    const file = event.target.files[0];

    if (!file) {
      setThumbnailFile(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      setError("La miniatura debe ser JPG, JPEG o PNG.");
      setThumbnailFile(null);
      return;
    }

    setError("");
    setThumbnailFile(file);
  }

  async function handlePublishVideo(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    if (!description.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }

    if (!videoFile) {
      setError("Selecciona un video MP4.");
      return;
    }

    if (!thumbnailFile) {
      setError("Selecciona una miniatura JPG, JPEG o PNG.");
      return;
    }

    try {
      setUploading(true);

      // Subir video y miniatura directamente a S3
      const uploadedFiles = await uploadVideoFiles(videoFile, thumbnailFile);

      // Crear registro en la base de datos
      const newVideo = await createVideo({
        title: title.trim(),
        description: description.trim(),
        category,
        video_url: uploadedFiles.video_url,
        thumbnail_url: uploadedFiles.thumbnail_url,
      });

      setVideos((previous) => [newVideo, ...previous]);

      // Limpiar formulario
      setTitle("");
      setDescription("");
      setCategory("General");
      setVideoFile(null);
      setThumbnailFile(null);

      // Limpiar los inputs de archivos
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }

      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = "";
      }

      setMessage("Video publicado correctamente.");
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  }

  function startEditing(video) {
    setEditingVideoId(video.id);
    setEditingTitle(video.title);
    setEditingDescription(video.description);
    setEditingCategory(video.category || "General");

    setError("");
    setMessage("");
  }

  function cancelEditing() {
    setEditingVideoId(null);
    setEditingTitle("");
    setEditingDescription("");
    setEditingCategory("General");
  }

  async function handleUpdateVideo(videoId) {
    if (!editingTitle.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    if (!editingDescription.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }

    try {
      setError("");
      setMessage("");

      const updatedVideo = await updateVideo(videoId, {
        title: editingTitle.trim(),
        description: editingDescription.trim(),
        category: editingCategory,
      });

      setVideos((previous) =>
        previous.map((video) => (video.id === videoId ? updatedVideo : video)),
      );

      cancelEditing();

      setMessage("Video actualizado correctamente.");
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDeleteVideo(videoId) {
    const confirmed = window.confirm("¿Estás seguro de eliminar este video?");

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await deleteVideo(videoId);

      setVideos((previous) => previous.filter((video) => video.id !== videoId));

      setMessage("Video eliminado correctamente.");
    } catch (error) {
      setError(error.message);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="profile-container">
          <p>Cargando perfil...</p>
        </main>
      </>
    );
  }

  if (error && !user) {
    return (
      <>
        <Navbar />

        <main className="profile-container">
          <p>{error}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="profile-container">
        {/* =========================================
                    INFORMACIÓN DEL USUARIO
                ========================================= */}

        <section className="profile-info">
          <h1>Perfil de usuario</h1>

          <h2>{user.name}</h2>

          <p>{user.email}</p>

          <p>Videos publicados {videos.length}</p>
        </section>

        {/* =========================================
                    MENSAJES
                ========================================= */}

        {error && <p className="error-message">{error}</p>}

        {message && <p className="success-message">{message}</p>}

        {/* =========================================
                    PUBLICAR VIDEO
                ========================================= */}

        <section className="publish-video">
          <h2>Publicar nuevo video</h2>

          <form onSubmit={handlePublishVideo}>
            <div>
              <label htmlFor="title">Título</label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="description">Descripción</label>

              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows="5"
                required
              />
            </div>
            <div>
              <label htmlFor="category">Categoría</label>

              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
              >
                <option value="General">General</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Educación">Educación</option>
                <option value="Videojuegos">Videojuegos</option>
                <option value="Música">Música</option>
                <option value="Entretenimiento">Entretenimiento</option>
                <option value="Deportes">Deportes</option>
                <option value="Ciencia">Ciencia</option>
                <option value="Arte">Arte</option>
                <option value="Noticias">Noticias</option>
              </select>
            </div>
            <div>
              <label htmlFor="video-file">Video MP4</label>

              <input
                ref={videoInputRef}
                id="video-file"
                type="file"
                accept="video/mp4"
                onChange={handleVideoFileChange}
                required
              />
            </div>

            <div>
              <label htmlFor="thumbnail-file">Miniatura</label>

              <input
                ref={thumbnailInputRef}
                id="thumbnail-file"
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handleThumbnailFileChange}
                required
              />
            </div>

            <button type="submit" disabled={uploading}>
              {uploading ? "Publicando..." : "Publicar video"}
            </button>
          </form>
        </section>

        {/* =========================================
                    VIDEOS DEL USUARIO
                ========================================= */}

        <section className="user-videos">
          <h2>Mis videos</h2>

          {videos.length === 0 ? (
            <p>Todavía no has publicado ningún video.</p>
          ) : (
            <div className="profile-video-list">
              {videos.map((video) => (
                <article key={video.id} className="profile-video">
                  <img src={video.thumbnail_url} alt={video.title} />

                  {editingVideoId === video.id ? (
                    <div className="edit-video-form">
                      <label>Título</label>

                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(event) =>
                          setEditingTitle(event.target.value)
                        }
                      />
                      <label>Categoría</label>

                      <select
                        value={editingCategory}
                        onChange={(event) =>
                          setEditingCategory(event.target.value)
                        }
                      >
                        <option value="General">General</option>
                        <option value="Tecnología">Tecnología</option>
                        <option value="Educación">Educación</option>
                        <option value="Videojuegos">Videojuegos</option>
                        <option value="Música">Música</option>
                        <option value="Entretenimiento">Entretenimiento</option>
                        <option value="Deportes">Deportes</option>
                        <option value="Ciencia">Ciencia</option>
                        <option value="Arte">Arte</option>
                        <option value="Noticias">Noticias</option>
                      </select>

                      <label>Descripción</label>

                      <textarea
                        value={editingDescription}
                        onChange={(event) =>
                          setEditingDescription(event.target.value)
                        }
                        rows="4"
                      />

                      <button
                        type="button"
                        onClick={() => handleUpdateVideo(video.id)}
                      >
                        Guardar cambios
                      </button>

                      <button type="button" onClick={cancelEditing}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="profile-video-info">
                      <h3>{video.title}</h3>
                      <p className="video-category">{video.category}</p>
                      <p>{video.description}</p>

                      <p>{video.views} vistas</p>

                      <p>
                        Publicado el{" "}
                        {new Date(video.created_at).toLocaleDateString(
                          "es-EC",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          },
                        )}
                      </p>

                      <div className="video-actions">
                        <button
                          type="button"
                          onClick={() => navigate(`/video/${video.id}`)}
                        >
                          Ver video
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditing(video)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(video.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default Profile;
