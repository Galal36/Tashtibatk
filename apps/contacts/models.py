import uuid

from django.conf import settings
from django.db import models


class ContactForm(models.Model):
    NEW, IN_PROGRESS, CLOSED = "new", "in_progress", "closed"
    STATUS_CHOICES = [
        (NEW, "New"),
        (IN_PROGRESS, "In progress"),
        (CLOSED, "Closed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assigned_to = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_contacts",
    )
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=40)
    email = models.EmailField(blank=True)
    service_interest = models.CharField(max_length=120, blank=True)
    # Defaults to the site's country (settings.SITE_COUNTRY) but stored per-row
    # so a single deployment could still receive leads from elsewhere.
    country = models.CharField(max_length=80, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=NEW)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "is_read"])]

    def save(self, *args, **kwargs):
        if not self.country:
            self.country = getattr(settings, "SITE_COUNTRY", "")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} — {self.get_status_display()}"
