import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import VideoCard from "../components/VideoCard";

import { getVideos } from "../api";


function Home() {
    const navigate = useNavigate();

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


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


    return (
        <>
            <Navbar />

            <main className="home-container">
                <h1>Videos</h1>

                {loading && (
                    <p>Cargando videos...</p>
                )}

                {error && (
                    <p>{error}</p>
                )}

                {!loading &&
                    !error &&
                    videos.length === 0 && (
                        <p>
                            No hay videos disponibles.
                        </p>
                    )}

                {!loading &&
                    !error &&
                    videos.length > 0 && (
                        <div className="video-grid">
                            {videos.map((video) => (
                                <div
                                    key={video.id}
                                    onClick={() =>
                                        handleVideoClick(
                                            video.id
                                        )
                                    }
                                >
                                    <VideoCard
                                        video={video}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
            </main>
        </>
    );
}


export default Home;