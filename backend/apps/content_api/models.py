"""
Models for the AI content pipeline (n8n -> claude -p -> Telegram approval).

Topic       — the queue of article ideas, managed by the owner in Django admin.
Submission  — one generated topic = one AR/EN/UR set of draft Articles. Its id
              IS the articles' translation_group, so hreflang works unchanged.
"""
import uuid

from django.db import models

from apps.services.models import ServiceCategory


class Topic(models.Model):
    PENDING, USED, SKIPPED = "pending", "used", "skipped"
    STATUS_CHOICES = [(PENDING, "Pending"), (USED, "Used"), (SKIPPED, "Skipped")]

    title = models.CharField(max_length=255, unique=True)
    keyword = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True, help_text="Extra guidance for the writer.")
    category = models.ForeignKey(
        ServiceCategory, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="content_topics",
    )
    # Higher priority is written first.
    priority = models.IntegerField(default=0, db_index=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING, db_index=True)
    reject_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-priority", "created_at"]

    def __str__(self):
        return self.title


class Submission(models.Model):
    DRAFT, PUBLISHED, REJECTED = "draft", "published", "rejected"
    STATUS_CHOICES = [(DRAFT, "Draft"), (PUBLISHED, "Published"), (REJECTED, "Rejected")]

    # Equals Article.translation_group of the AR/EN/UR drafts it created.
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(
        Topic, on_delete=models.SET_NULL, null=True, related_name="submissions"
    )
    preview_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=DRAFT)
    # {"ar": [{"q": ..., "a": ...}], "en": [...]} — kept for FAQ JSON-LD later.
    faq = models.JSONField(default=dict, blank=True)
    reject_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.topic or 'deleted topic'} [{self.status}]"
