function VideoCard({ video }) {
    return (
        <article className="video-card">
            <img
                src={video.thumbnail_url}
                alt={video.title}
                className="video-thumbnail"
            />

            <div className="video-info">
                <span className="video-category">
                    {video.category || "General"}
                </span>

                <h2>{video.title}</h2>

                <p className="video-description">
                    {video.description}
                </p>

                <p className="video-uploader">
                    {video.uploader}
                </p>

                <p className="video-stats">
                    {video.views} {video.views === 1 ? "vista" : "vistas"}
                </p>

                <p className="video-date">
                    {new Date(video.created_at).toLocaleDateString()}
                </p>
            </div>
        </article>
    );
}

export default VideoCard;