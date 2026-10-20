from django.conf import settings
from django.contrib import admin
from django.utils.html import format_html

from .models import Submission, Topic


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "priority", "status", "reject_count", "created_at")
    list_editable = ("priority", "status")
    list_filter = ("status", "category")
    search_fields = ("title", "keyword", "notes")
    ordering = ("-priority", "created_at")


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("topic", "status", "created_at", "decided_at", "preview_link")
    list_filter = ("status",)
    search_fields = ("topic__title",)
    readonly_fields = ("id", "topic", "preview_token", "status", "faq", "reject_reason", "created_at", "decided_at")

    @admin.display(description="Preview")
    def preview_link(self, obj):
        url = f"{settings.SITE_DOMAIN.rstrip('/')}/api/content/preview/{obj.preview_token}/"
        return format_html('<a href="{}" target="_blank">open</a>', url)

    def has_add_permission(self, request):
        return False
