from rest_framework import serializers

from .models import ServiceCategory, ServicePage


class ServiceCategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = ServiceCategory
        fields = [
            "id", "slug", "name", "name_ar", "name_en", "name_ur",
            "icon", "display_order", "is_active",
        ]

    def get_name(self, obj):
        locale = self.context.get("locale", "en")
        return obj.name_for(locale)


class ServiceCategoryAdminSerializer(serializers.ModelSerializer):
    """Full category payload for the admin dashboard (all locales + SEO + counts)."""

    image_url = serializers.SerializerMethodField()
    article_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ServiceCategory
        fields = [
            "id", "slug",
            "name_ar", "name_en", "name_ur",
            "description_ar", "description_en", "description_ur",
            "image", "image_url", "icon",
            "meta_title", "meta_description",
            "display_order", "is_active", "article_count",
        ]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class ServicePageSerializer(serializers.ModelSerializer):
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    effective_meta = serializers.SerializerMethodField()

    class Meta:
        model = ServicePage
        fields = [
            "id", "category", "category_slug", "language", "slug", "title",
            "description", "meta_title", "meta_description", "og_image",
            "is_active", "updated_at", "effective_meta",
        ]

    def get_effective_meta(self, obj):
        return {
            "title": obj.effective_meta_title,
            "description": obj.meta_description,
            "og_image": obj.og_image.url if obj.og_image else None,
        }
