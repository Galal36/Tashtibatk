from django.conf import settings
from PIL import Image
from rest_framework import serializers

from .models import MediaAsset


def validate_image_upload(file):
    """Shared upload guard: extension allowlist, size cap, real-image check.
    Used by the media library and any other image upload field."""
    ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else ""
    allowed = settings.ALLOWED_IMAGE_EXTENSIONS
    if ext not in allowed:
        raise serializers.ValidationError(
            f"Unsupported file type '.{ext}'. Allowed: {', '.join(sorted(allowed))}."
        )
    if file.size > settings.MAX_IMAGE_UPLOAD_SIZE:
        mb = settings.MAX_IMAGE_UPLOAD_SIZE // (1024 * 1024)
        raise serializers.ValidationError(f"File too large (max {mb} MB).")
    # Verify the bytes really are a decodable image (not a renamed payload).
    try:
        img = Image.open(file)
        img.verify()
    except Exception:
        raise serializers.ValidationError("File is not a valid image.")
    finally:
        file.seek(0)
    return file


class MediaAssetSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = [
            "id", "file", "url", "title", "alt_text", "caption",
            "width", "height", "file_size", "mime_type", "created_at",
        ]
        read_only_fields = [
            "id", "url", "width", "height", "file_size", "mime_type", "created_at",
        ]

    def get_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url

    def validate_file(self, value):
        validate_image_upload(value)
        return value

    def create(self, validated_data):
        file = validated_data.get("file")
        if file is not None:
            validated_data["mime_type"] = getattr(file, "content_type", "") or ""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["uploaded_by"] = request.user
        return super().create(validated_data)
