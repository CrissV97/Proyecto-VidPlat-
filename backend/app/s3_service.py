import os
import uuid

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION")
S3_VIDEO_BUCKET = os.getenv("S3_VIDEO_BUCKET")
S3_THUMBNAIL_BUCKET = os.getenv("S3_THUMBNAIL_BUCKET")

if not AWS_REGION:
    raise RuntimeError("AWS_REGION no está configurada")

if not S3_VIDEO_BUCKET:
    raise RuntimeError("S3_VIDEO_BUCKET no está configurada")

if not S3_THUMBNAIL_BUCKET:
    raise RuntimeError("S3_THUMBNAIL_BUCKET no está configurada")


# En EC2 boto3 utilizará automáticamente el IAM Role asociado
# a la instancia. No se colocan Access Key ni Secret Key aquí.
s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION
)


def generate_object_key(folder: str, filename: str) -> str:
    """
    Genera una clave única para un objeto de S3.
    """
    extension = os.path.splitext(filename)[1].lower()

    return f"{folder}/{uuid.uuid4()}{extension}"


def generate_presigned_upload_url(
    bucket: str,
    object_key: str,
    content_type: str,
    expiration: int = 900
) -> str:
    """
    Genera una URL temporal para subir directamente un archivo a S3.
    """

    return s3_client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": bucket,
            "Key": object_key,
            "ContentType": content_type
        },
        ExpiresIn=expiration
    )


def generate_presigned_download_url(
    bucket: str,
    object_key: str,
    expiration: int = 3600
) -> str:
    """
    Genera una URL temporal para visualizar o descargar un objeto.
    """

    return s3_client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": bucket,
            "Key": object_key
        },
        ExpiresIn=expiration
    )


def generate_video_upload_url(
    filename: str,
    content_type: str
) -> dict:
    """
    Genera una URL para subir un video directamente al bucket de videos.
    """

    object_key = generate_object_key("videos", filename)

    upload_url = generate_presigned_upload_url(
        bucket=S3_VIDEO_BUCKET,
        object_key=object_key,
        content_type=content_type
    )

    return {
        "upload_url": upload_url,
        "object_key": object_key
    }


def generate_thumbnail_upload_url(
    filename: str,
    content_type: str
) -> dict:
    """
    Genera una URL para subir una miniatura directamente al bucket.
    """

    object_key = generate_object_key("thumbnails", filename)

    upload_url = generate_presigned_upload_url(
        bucket=S3_THUMBNAIL_BUCKET,
        object_key=object_key,
        content_type=content_type
    )

    return {
        "upload_url": upload_url,
        "object_key": object_key
    }


def get_video_url(object_key: str) -> str:
    """
    Genera una URL temporal para reproducir un video.
    """

    return generate_presigned_download_url(
        S3_VIDEO_BUCKET,
        object_key
    )


def get_thumbnail_url(object_key: str) -> str:
    """
    Genera una URL temporal para mostrar una miniatura.
    """

    return generate_presigned_download_url(
        S3_THUMBNAIL_BUCKET,
        object_key
    )


def delete_video_object(object_key: str) -> None:
    """
    Elimina un video del bucket de S3.
    """

    if not object_key:
        return

    s3_client.delete_object(
        Bucket=S3_VIDEO_BUCKET,
        Key=object_key
    )


def delete_thumbnail_object(object_key: str) -> None:
    """
    Elimina una miniatura del bucket de S3.
    """

    if not object_key:
        return

    s3_client.delete_object(
        Bucket=S3_THUMBNAIL_BUCKET,
        Key=object_key
    )


def object_exists(bucket: str, object_key: str) -> bool:

    try:
        s3_client.head_object(
            Bucket=bucket,
            Key=object_key
        )
        return True

    except ClientError as error:
        error_code = error.response.get("Error", {}).get("Code")

        if error_code in ("404", "NoSuchKey", "NotFound"):
            return False

        raise