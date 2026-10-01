const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error("VITE_API_URL no está configurada");
}


// ============================================================
// FUNCIÓN GENERAL PARA PETICIONES A FASTAPI
// ============================================================

async function request(endpoint, options = {}) {
    const token = localStorage.getItem("access_token");

    const headers = {
        ...(options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    let data = null;

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
        data = await response.json();
    }

    if (!response.ok) {
        throw new Error(
            data?.detail || "Error en la solicitud"
        );
    }

    return data;
}


// ============================================================
// AUTENTICACIÓN
// ============================================================

export async function registerUser(user) {
    return request("/users", {
        method: "POST",
        body: JSON.stringify(user)
    });
}


export async function loginUser(credentials) {
    const data = await request("/login", {
        method: "POST",
        body: JSON.stringify(credentials)
    });

    localStorage.setItem(
        "access_token",
        data.access_token
    );

    localStorage.setItem(
        "user_id",
        String(data.user_id)
    );

    return data;
}

export function logoutUser() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
}

export function getUserId() {
    return localStorage.getItem("user_id");
}

export function getToken() {
    return localStorage.getItem("access_token");
}


export function isAuthenticated() {
    return Boolean(
        localStorage.getItem("access_token")
    );
}


// ============================================================
// USUARIOS
// ============================================================

export async function getUser(userId) {
    return request(`/users/${userId}`);
}


export async function updateUser(userId, userData) {
    return request(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(userData)
    });
}


export async function getUserVideos(userId) {
    return request(`/users/${userId}/videos`);
}


// ============================================================
// VIDEOS
// ============================================================

export async function getVideos() {
    return request("/videos");
}


export async function getVideo(videoId) {
    return request(`/videos/${videoId}`);
}


export async function getRecommendedVideos(videoId) {
    return request(`/videos/recommended/${videoId}`);
}


// ============================================================
// SUBIDA DE VIDEO A S3
// ============================================================

export async function getVideoUploadUrl(
    filename,
    contentType
) {
    return request("/videos/upload-video-url", {
        method: "POST",
        body: JSON.stringify({
            filename,
            content_type: contentType
        })
    });
}


// ============================================================
// SUBIDA DE MINIATURA A S3
// ============================================================

export async function getThumbnailUploadUrl(
    filename,
    contentType
) {
    return request("/videos/upload-thumbnail-url", {
        method: "POST",
        body: JSON.stringify({
            filename,
            content_type: contentType
        })
    });
}


// ============================================================
// SUBIR ARCHIVO DIRECTAMENTE A S3
// ============================================================

export async function uploadFileToS3(
    uploadUrl,
    file
) {
    const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": file.type
        },
        body: file
    });

    if (!response.ok) {
        throw new Error(
            "No se pudo subir el archivo a S3"
        );
    }

    return true;
}


// ============================================================
// FLUJO COMPLETO PARA SUBIR VIDEO
// ============================================================

export async function uploadVideoFiles(
    videoFile,
    thumbnailFile
) {
    // 1. Obtener URL firmada para el video
    const videoUpload = await getVideoUploadUrl(
        videoFile.name,
        videoFile.type
    );

    // 2. Subir video directamente a S3
    await uploadFileToS3(
        videoUpload.upload_url,
        videoFile
    );

    // 3. Obtener URL firmada para la miniatura
    const thumbnailUpload = await getThumbnailUploadUrl(
        thumbnailFile.name,
        thumbnailFile.type
    );

    // 4. Subir miniatura directamente a S3
    await uploadFileToS3(
        thumbnailUpload.upload_url,
        thumbnailFile
    );

    // Devuelve las claves permanentes de S3
    return {
        video_url: videoUpload.object_key,
        thumbnail_url: thumbnailUpload.object_key
    };
}


// ============================================================
// CREAR REGISTRO DEL VIDEO
// ============================================================

export async function createVideo(videoData) {
    return request("/videos", {
        method: "POST",
        body: JSON.stringify(videoData)
    });
}


// ============================================================
// ACTUALIZAR VIDEO
// ============================================================

export async function updateVideo(
    videoId,
    videoData
) {
    return request(`/videos/${videoId}`, {
        method: "PUT",
        body: JSON.stringify(videoData)
    });
}


// ============================================================
// ELIMINAR VIDEO
// ============================================================

export async function deleteVideo(videoId) {
    return request(`/videos/${videoId}`, {
        method: "DELETE"
    });
}


// ============================================================
// VISTAS
// ============================================================

export async function addView(videoId) {
    return request(`/videos/${videoId}/view`, {
        method: "POST"
    });
}


// ============================================================
// COMENTARIOS
// ============================================================

export async function getComments(videoId) {
    return request(
        `/videos/${videoId}/comments`
    );
}


export async function createComment(
    videoId,
    content
) {
    return request(
        `/videos/${videoId}/comments`,
        {
            method: "POST",
            body: JSON.stringify({
                content
            })
        }
    );
}


export async function updateComment(
    commentId,
    content
) {
    return request(
        `/comments/${commentId}`,
        {
            method: "PUT",
            body: JSON.stringify({
                content
            })
        }
    );
}


export async function deleteComment(commentId) {
    return request(
        `/comments/${commentId}`,
        {
            method: "DELETE"
        }
    );
}