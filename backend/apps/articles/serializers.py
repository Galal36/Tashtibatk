from django.conf import settings
from rest_framework import serializers

from .models import Article


def _abs_url(serializer, image):
    """Absolute URL for an ImageField, anchored to the canonical public domain.

    Article images are rendered server-side by Next.js, whose fetch hits
    gunicorn directly at 127.0.0.1:8012 — so `request.build_absolute_uri`
    would produce an internal, browser-unreachable host. Building from
    SITE_DOMAIN guarantees a correct public URL for both card images and the
    OG/SEO meta tags."""
    if not image:
        return None
    url = image.url
    if url.startswith("http://") or url.startswith("https://"):
        return url
    base = getattr(settings, "SITE_DOMAIN", "").rstrip("/")
    if base:
        return f"{base}{url}"
    request = serializer.context.get("request")
    return request.build_absolute_uri(url) if request else url


class ArticleListSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)
    category_name = serializers.SerializerMethodField()
    og_image = serializers.SerializerMethodField()
    featured_image = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id", "title", "slug", "language", "status", "category",
            "category_name", "author_name", "og_image", "featured_image",
            "published_at", "updated_at",
        ]

    def get_category_name(self, obj):
        if not obj.category:
            return None
        return obj.category.name_for(obj.language)

    def get_og_image(self, obj):
        return _abs_url(self, obj.og_image)

    def get_featured_image(self, obj):
        return _abs_url(self, obj.featured_image)


class ArticleDetailSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)
    category_name = serializers.SerializerMethodField()
    featured_image_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()
    effective_meta = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id", "author", "author_name", "category", "category_name",
            "language", "status", "translation_group", "title", "slug", "body",
            "featured_image", "featured_image_url", "featured_image_alt",
            "meta_title", "meta_description", "focus_keyword",
            "og_image", "og_image_url", "og_title", "og_description",
            "canonical_url",
            "published_at", "created_at", "updated_at",
            "effective_meta", "translations",
        ]
        read_only_fields = ["id", "author", "translation_group", "created_at", "updated_at"]

    def get_category_name(self, obj):
        if not obj.category:
            return None
        return obj.category.name_for(obj.language)

    def get_featured_image_url(self, obj):
        return _abs_url(self, obj.featured_image)

    def get_og_image_url(self, obj):
        return _abs_url(self, obj.og_image)

    def get_effective_meta(self, obj):
        return {
            "title": obj.effective_meta_title,
            "description": obj.effective_meta_description,
            "og_image": _abs_url(self, obj.og_image),
        }

    def get_translations(self, obj):
        """Sibling-language versions of the same topic — drives hreflang."""
        siblings = (
            Article.objects.filter(translation_group=obj.translation_group)
            .exclude(pk=obj.pk)
            .values("language", "slug", "status")
        )
        return {s["language"]: s["slug"] for s in siblings if s["status"] == Article.PUBLISHED}
