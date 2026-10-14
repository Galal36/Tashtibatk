import uuid

from django.db import models


class MediaAsset(models.Model):
    """A reusable uploaded image, shown in the WordPress-like Media Library and
    insertable into article bodies / featured images."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ImageField(upload_to="library/%Y/%m/")
    title = models.CharField(max_length=255, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    caption = models.CharField(max_length=500, blank=True)

    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="media_assets",
    )

    # Auto-filled from the image on save.
    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)
    file_size = models.PositiveIntegerField(default=0)  # bytes
    mime_type = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title or self.file.name

    def save(self, *args, **kwargs):
        if self.file and not self.width:
            try:
                self.width = self.file.width
                self.height = self.file.height
            except Exception:
                pass
        if self.file and not self.file_size:
            try:
                self.file_size = self.file.size
            except Exception:
                pass
        if self.file and not self.title:
            # Default the title to the uploaded filename (without extension).
            name = self.file.name.rsplit("/", 1)[-1]
            self.title = name.rsplit(".", 1)[0][:255]
        super().save(*args, **kwargs)
