import re
import uuid

import nh3
from django.db import models
from django.utils import timezone
from django.utils.html import strip_tags

from apps.services.models import ServiceCategory

# Tags/attributes allowed in article HTML bodies coming from the rich editor.
# Anything else is stripped on save to prevent stored XSS.
ALLOWED_TAGS = {
    "p", "br", "strong", "b", "em", "i", "u", "s", "mark", "sub", "sup",
    "blockquote", "code", "pre",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td", "hr", "span", "div",
}
# Tags allowed to carry a (heavily filtered) inline `style` for the editor's
# colour / highlight / font-size / alignment controls.
STYLEABLE_TAGS = {
    "span", "mark", "p", "div", "td", "th", "li", "blockquote",
    "h1", "h2", "h3", "h4", "h5", "h6",
}
ALLOWED_ATTRS = {
    # nh3/ammonia injects rel="noopener noreferrer" on links itself — don't list "rel".
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "title", "width", "height", "loading"},
    "span": {"dir", "style"},
    "mark": {"style"},
    "div": {"dir", "style"},
    "p": {"dir", "style"},
    "li": {"style"},
    "blockquote": {"style"},
    "h1": {"style"}, "h2": {"style"}, "h3": {"style"},
    "h4": {"style"}, "h5": {"style"}, "h6": {"style"},
    "td": {"colspan", "rowspan", "style"},
    "th": {"colspan", "rowspan", "style"},
}

# CSS declarations we accept inside a `style` attribute, each paired with a
# regex its value must fully match. Anything else (positioning, url(), etc.)
# is dropped — this is what keeps `style` from becoming an XSS vector.
_COLOR = r"(#[0-9a-fA-F]{3,8}|rgba?\([\d.,\s%]+\)|[a-zA-Z]+)"
_SIZE = r"\d{1,3}(\.\d+)?(px|em|rem|%|pt)"
SAFE_CSS = {
    "color": re.compile(rf"^\s*{_COLOR}\s*$"),
    "background-color": re.compile(rf"^\s*{_COLOR}\s*$"),
    "background": re.compile(rf"^\s*{_COLOR}\s*$"),
    "text-align": re.compile(r"^\s*(left|right|center|justify|start|end)\s*$"),
    "font-size": re.compile(rf"^\s*{_SIZE}\s*$"),
}


def _sanitize_style(value: str) -> str:
    """Keep only whitelisted CSS declarations with safe values."""
    kept = []
    for decl in value.split(";"):
        if ":" not in decl:
            continue
        prop, _, val = decl.partition(":")
        prop = prop.strip().lower()
        val = val.strip()
        pattern = SAFE_CSS.get(prop)
        if pattern and pattern.match(val) and "url(" not in val.lower():
            kept.append(f"{prop}: {val}")
    return "; ".join(kept)


def _attribute_filter(tag: str, attr: str, value: str):
    """nh3 attribute_filter hook — sanitize `style`, pass everything else."""
    if attr == "style":
        if tag not in STYLEABLE_TAGS:
            return None
        cleaned = _sanitize_style(value)
        return cleaned or None
    return value


def clean_body(html: str) -> str:
    """Sanitize rich-editor HTML — the security backstop against stored XSS."""
    return nh3.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        attribute_filter=_attribute_filter,
    )


class Article(models.Model):
    DRAFT, PUBLISHED, SCHEDULED, ARCHIVED = "draft", "published", "scheduled", "archived"
    STATUS_CHOICES = [
        (DRAFT, "Draft"),
        (PUBLISHED, "Published"),
        (SCHEDULED, "Scheduled"),
        (ARCHIVED, "Archived"),
    ]

    AR, EN, UR = "ar", "en", "ur"
    LANGUAGE_CHOICES = [(AR, "Arabic"), (EN, "English"), (UR, "Urdu")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="articles"
    )
    category = models.ForeignKey(
        ServiceCategory, on_delete=models.SET_NULL, null=True, related_name="articles"
    )
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default=AR)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=DRAFT)

    # Links the AR/EN/UR versions of the SAME topic together so hreflang and
    # the editor's language switcher can be generated automatically.
    translation_group = models.UUIDField(default=uuid.uuid4, db_index=True, editable=False)

    # Content
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)  # latin/transliterated, unique per language
    body = models.TextField()

    # Featured image — the card/listing/preview image (distinct from the
    # social og_image below). Falls back to a gradient in the UI when empty.
    featured_image = models.ImageField(
        upload_to="articles/featured/", blank=True, null=True
    )
    featured_image_alt = models.CharField(max_length=160, blank=True)

    # SEO
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    focus_keyword = models.CharField(max_length=80, blank=True)
    og_image = models.ImageField(upload_to="articles/", blank=True, null=True)
    og_title = models.CharField(max_length=70, blank=True)
    og_description = models.CharField(max_length=200, blank=True)
    canonical_url = models.URLField(blank=True)

    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["language", "slug"], name="uniq_article_lang_slug"
            ),
        ]
        indexes = [
            models.Index(fields=["language", "status"]),
            models.Index(fields=["category", "language"]),
            models.Index(fields=["translation_group"]),
        ]

    def __str__(self):
        return f"[{self.language.upper()}] {self.title}"

    def save(self, *args, **kwargs):
        # Sanitize HTML body on every save — defence in depth against XSS.
        if self.body:
            self.body = clean_body(self.body)
        super().save(*args, **kwargs)

    def publish(self):
        self.status = self.PUBLISHED
        if not self.published_at:
            self.published_at = timezone.now()
        self.save(update_fields=["status", "published_at", "body", "updated_at"])

    @property
    def effective_meta_title(self):
        return self.meta_title or self.title

    @property
    def effective_meta_description(self):
        if self.meta_description:
            return self.meta_description
        # body is HTML — strip tags before slicing so meta isn't broken markup
        return strip_tags(self.body)[:160].strip()
