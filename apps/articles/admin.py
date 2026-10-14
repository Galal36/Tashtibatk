from django.contrib import admin

from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "language", "status", "category", "author", "published_at")
    list_filter = ("language", "status", "category")
    search_fields = ("title", "slug", "meta_title")
    readonly_fields = ("created_at", "updated_at", "translation_group")
    autocomplete_fields = ("category",)
    fieldsets = (
        ("Content", {"fields": ("title", "slug", "language", "category", "status", "body")}),
        ("SEO", {"fields": ("meta_title", "meta_description", "og_image", "canonical_url")}),
        ("Linking", {"fields": ("translation_group",)}),
        ("Dates", {"fields": ("published_at", "created_at", "updated_at")}),
    )
