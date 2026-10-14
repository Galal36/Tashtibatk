import uuid

from django.db import models


class ServiceCategory(models.Model):
    """
    A service offered (e.g. apartment finishing, plumbing, carpentry...).
    Names are stored per-locale so a category needs no translation table.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True)
    name_ar = models.CharField(max_length=120)
    name_en = models.CharField(max_length=120)
    name_ur = models.CharField(max_length=120)
    description_ar = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    description_ur = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    icon = models.CharField(max_length=60, blank=True)
    # SEO
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["display_order"]
        verbose_name_plural = "service categories"

    def __str__(self):
        return self.name_en

    def name_for(self, locale):
        return getattr(self, f"name_{locale}", self.name_en)

    def description_for(self, locale):
        return getattr(self, f"description_{locale}", self.description_en)


class ServicePage(models.Model):
    """The landing/marketing page for a category, one row per locale."""

    AR, EN, UR = "ar", "en", "ur"
    LANGUAGE_CHOICES = [(AR, "Arabic"), (EN, "English"), (UR, "Urdu")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        ServiceCategory, on_delete=models.CASCADE, related_name="pages"
    )
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default=AR)
    slug = models.SlugField(max_length=255)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # SEO
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    og_image = models.ImageField(upload_to="service_pages/", blank=True, null=True)

    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # one slug per language; same category gets one page per language
        constraints = [
            models.UniqueConstraint(
                fields=["language", "slug"], name="uniq_servicepage_lang_slug"
            ),
            models.UniqueConstraint(
                fields=["category", "language"], name="uniq_servicepage_category_lang"
            ),
        ]
        indexes = [models.Index(fields=["language", "is_active"])]

    def __str__(self):
        return f"[{self.language.upper()}] {self.title}"

    @property
    def effective_meta_title(self):
        return self.meta_title or self.title
