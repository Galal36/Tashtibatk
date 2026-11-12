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
    # Rich landing-page body (sanitized HTML, same allowlist as articles). When
    # empty the frontend falls back to the plain-text `description`.
    body = models.TextField(blank=True, default="")
    # [{"q": "...", "a": "..."}] — rendered visibly on the page AND as FAQPage
    # JSON-LD from this same list, so the two can never drift apart.
    faq = models.JSONField(blank=True, default=list)

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

    def clean(self):
        from django.core.exceptions import ValidationError

        if not isinstance(self.faq, list) or not all(
            isinstance(f, dict) and set(f) == {"q", "a"}
            and all(isinstance(v, str) and v.strip() for v in f.values())
            for f in self.faq
        ):
            raise ValidationError({"faq": 'Must be a list of {"q": "...", "a": "..."} with non-empty text.'})

    def save(self, *args, **kwargs):
        # local import: apps.articles.models imports this module
        from django.utils.html import strip_tags

        from apps.articles.models import clean_body

        self.body = clean_body(self.body) if self.body else ""
        if isinstance(self.faq, list):  # FAQ is plain text only
            self.faq = [
                {"q": strip_tags(f["q"]).strip(), "a": strip_tags(f["a"]).strip()}
                for f in self.faq if isinstance(f, dict) and f.get("q") and f.get("a")
            ]
        super().save(*args, **kwargs)

    @property
    def effective_meta_title(self):
        return self.meta_title or self.title
