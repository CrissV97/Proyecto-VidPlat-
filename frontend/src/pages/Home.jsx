import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import VideoCard from "../components/VideoCard";

import { getVideos } from "../services/api";

function Home() {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";

  const categories = [
    "Todos",
    "General",
    "Tecnología",
    "Educación",
    "Videojuegos",
    "Música",
    "Entretenimiento",
    "Deportes",
    "Ciencia",
    "Arte",
    "Noticias",
  ];

  useEffect(() => {
    async function loadVideos() {
      try {
        setLoading(true);
        setError("");

        const videosData = await getVideos();

        setVideos(videosData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadVideos();
  }, []);

  function handleVideoClick(videoId) {
    navigate(`/video/${videoId}`);
  }

  const filteredVideos = videos.filter((video) => {
    const matchesCategory =
      selectedCategory === "Todos" || video.category === selectedCategory;

    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      search === "" ||
      video.title.toLowerCase().includes(search) ||
      video.description.toLowerCase().includes(search) ||
      video.uploader.toLowerCase().includes(search) ||
      video.category.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Navbar />

      <main className="home-container">
        <h1>Videos</h1>

        {/* SECCIÓN DE CATEGORÍAS */}
        {!loading && !error && videos.length > 0 && (
          <section className="categories-section">
            <h2>Categorías</h2>

            <div className="categories-list">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    selectedCategory === category
                      ? "category-button active"
                      : "category-button"
                  }
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* CARGANDO */}
        {loading && <p>Cargando videos...</p>}

        {/* ERROR */}
        {error && <p>{error}</p>}

        {/* NO HAY VIDEOS */}
        {!loading && !error && videos.length === 0 && (
          <p>No hay videos disponibles.</p>
        )}

        {/* VIDEOS FILTRADOS */}
        {!loading && !error && videos.length > 0 && (
          <section className="videos-section">
            <div className="videos-section-header">
              <h2>
                {searchTerm
                  ? `Resultados para "${searchTerm}"`
                  : selectedCategory === "Todos"
                    ? "Todos los videos"
                    : `Videos de ${selectedCategory}`}
              </h2>

              <span className="video-count">
                {filteredVideos.length}{" "}
                {filteredVideos.length === 1 ? "video" : "videos"}
              </span>
            </div>

            {filteredVideos.length === 0 ? (
              <div className="no-category-videos">
                <p>
                  No hay videos disponibles en la categoría{" "}
                  <strong>{selectedCategory}</strong>.
                </p>
              </div>
            ) : (
              <div className="video-grid">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => handleVideoClick(video.id)}
                  >
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}

export default Home;
