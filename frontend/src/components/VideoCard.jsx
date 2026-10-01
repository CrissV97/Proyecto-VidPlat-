import { Link } from "react-router-dom";


function VideoCard({ video }) {
    const publicationDate = new Date(
        video.created_at
    ).toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });


    return (
        <Link
            to={`/video/${video.id}`}
            className="video-card"
        >
            <img
                src={video.thumbnail_url}
                alt={video.title}
                className="video-thumbnail"
            />

            <div className="video-info">
                <h2>{video.title}</h2>

                <p className="video-uploader">
                    {video.uploader}
                </p>

                <p className="video-stats">
                    {video.views} vistas
                </p>

                <p className="video-date">
                    Publicado el {publicationDate}
                </p>
            </div>
        </Link>
    );
}


export default VideoCard;