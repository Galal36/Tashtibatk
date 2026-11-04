"""
Token-protected content API used by n8n. Same contract on every site:

  GET  /api/content/next/                     next pending topic + context
  POST /api/content/articles/                 create AR/EN/UR drafts
  POST /api/content/articles/<id>/publish/    publish the whole set
  POST /api/content/articles/<id>/reject/     reject the whole set
  POST /api/content/topics/skip/              skip topics the writer found already covered
  GET  /api/content/preview/<token>/          noindex preview (no auth; unguessable token)
"""
import base64
import re
import binascii
import hmac
import io
import os
import uuid

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.utils.html import escape
from django.utils.text import slugify
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from apps.articles.models import Article
from apps.services.models import ServiceCategory, ServicePage

from .models import Submission, Topic

OTHERS_SLUG = "others"
REQUIRED_FIELDS = ("title", "slug", "meta_description", "excerpt", "body_html")
FAQ_HEADING = {"ar": "الأسئلة الشائعة", "en": "Frequently Asked Questions", "ur": "اکثر پوچھے جانے والے سوالات"}
RTL = {"ar", "ur"}
# After this many rejections a topic is skipped instead of re-queued.
MAX_REJECTIONS = 2
# The writer tries up to this many queued topics per run (duplicates are skipped).
CANDIDATES = 3
# Generated illustrations (make_images.py): 1 featured + up to 2 inline per language.
IMAGE_SIZE = (1200, 675)
IMAGE_MAX_BYTES = 150_000
MAX_INLINE_IMAGES = 2
IMAGE_DIR = "articles/auto"


class HasContentToken(BasePermission):
    """X-Content-Token header must equal settings.CONTENT_API_TOKEN (constant-time)."""

    def has_permission(self, request, view):
        expected = getattr(settings, "CONTENT_API_TOKEN", "")
        given = request.headers.get("X-Content-Token", "")
        if not expected or not given:
            return False
        return hmac.compare_digest(given.encode(), expected.encode())


def content_endpoint(methods):
    def wrap(fn):
        fn = permission_classes([HasContentToken])(fn)
        fn = authentication_classes([])(fn)
        return api_view(methods)(fn)
    return wrap


def _site_url(path):
    return f"{settings.SITE_DOMAIN.rstrip('/')}{path}"


def _article_url(article):
    return _site_url(f"/{article.language}/articles/{article.slug}")


def _unique_slug(raw, title, language):
    base = slugify(raw or "")[:200] or slugify(title)[:200] or f"article-{uuid.uuid4().hex[:8]}"
    slug, n = base, 2
    while Article.objects.filter(language=language, slug=slug).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


def _faq_html(language, faq):
    if not faq:
        return ""
    items = "".join(
        f"<h3>{escape(item['q'])}</h3><p>{escape(item['a'])}</p>" for item in faq
    )
    return f"<h2>{FAQ_HEADING.get(language, FAQ_HEADING['en'])}</h2>{items}"


def _validate_article(language, data):
    if not isinstance(data, dict):
        return f"{language}: must be an object"
    missing = [f for f in REQUIRED_FIELDS if not str(data.get(f) or "").strip()]
    if missing:
        return f"{language}: missing {', '.join(missing)}"
    faq = data.get("faq") or []
    if not isinstance(faq, list) or any(
        not isinstance(i, dict) or not i.get("q") or not i.get("a") for i in faq
    ):
        return f"{language}: faq must be a list of {{q, a}}"
    return None


def _decode_image(language, key, item):
    """Returns (bytes, alt) for one generated image or raises ValueError."""
    from PIL import Image

    if not isinstance(item, dict) or not item.get("data") or not str(item.get("alt") or "").strip():
        raise ValueError(f"{language}/{key}: image needs data and alt")
    try:
        raw = base64.b64decode(item["data"], validate=True)
    except (binascii.Error, ValueError):
        raise ValueError(f"{language}/{key}: data is not base64")
    if len(raw) > IMAGE_MAX_BYTES:
        raise ValueError(f"{language}/{key}: image is {len(raw)} bytes (max {IMAGE_MAX_BYTES})")
    try:
        with Image.open(io.BytesIO(raw)) as im:
            fmt, size = im.format, im.size
    except Exception:
        raise ValueError(f"{language}/{key}: not an image")
    if fmt != "WEBP" or size != IMAGE_SIZE:
        raise ValueError(f"{language}/{key}: must be WEBP {IMAGE_SIZE[0]}x{IMAGE_SIZE[1]}, got {fmt} {size}")
    return raw, str(item["alt"]).strip()[:160]


def _validate_images(language, images):
    """images = {"featured": {data, alt}, "inline": [{key, data, alt}, ...]} (optional)."""
    if images in (None, {}):
        return {}
    if not isinstance(images, dict) or "featured" not in images:
        raise ValueError(f"{language}: images must include 'featured'")
    out = {"featured": _decode_image(language, "featured", images["featured"]), "inline": []}
    inline = images.get("inline") or []
    if not isinstance(inline, list) or len(inline) > MAX_INLINE_IMAGES:
        raise ValueError(f"{language}: at most {MAX_INLINE_IMAGES} inline images")
    for item in inline:
        key = str((item or {}).get("key") or "")
        if not key.isidentifier():
            raise ValueError(f"{language}: inline image key must be a simple name")
        out["inline"].append((key, *_decode_image(language, key, item)))
    return out


def _store_image(submission_id, language, key, raw):
    name = default_storage.save(f"{IMAGE_DIR}/{submission_id}/{language}-{key}.webp", ContentFile(raw))
    return name, _site_url(default_storage.url(name))


def _delete_images(submission_id, articles):
    for article in articles:
        for f in (article.featured_image, article.og_image):
            if f and f.name and default_storage.exists(f.name):
                default_storage.delete(f.name)
    folder = f"{IMAGE_DIR}/{submission_id}"
    try:
        _dirs, files = default_storage.listdir(folder)
        for name in files:
            default_storage.delete(f"{folder}/{name}")
        os.rmdir(default_storage.path(folder))
    except (FileNotFoundError, NotImplementedError, OSError):
        pass


def _topic_json(topic):
    return {
        "id": topic.id,
        "title": topic.title,
        "keyword": topic.keyword,
        "notes": topic.notes,
        "category": topic.category.slug if topic.category else OTHERS_SLUG,
    }


def _skip_topics(items):
    """items = [{"id": .., "reason": ..}] -> marks pending topics skipped; returns the ones changed."""
    done = []
    for item in items or []:
        if not isinstance(item, dict):
            continue
        topic = Topic.objects.select_for_update().filter(pk=item.get("id"), status=Topic.PENDING).first()
        if topic is None:
            continue
        reason = str(item.get("reason") or "").strip()[:500]
        topic.status = Topic.SKIPPED
        topic.notes = f"{topic.notes}\nSkipped: {reason}".strip() if reason else topic.notes
        topic.save(update_fields=["status", "notes", "updated_at"])
        done.append({"id": topic.id, "title": topic.title, "reason": reason})
    return done


@content_endpoint(["GET"])
def next_topic(request):
    candidates = list(Topic.objects.filter(status=Topic.PENDING).select_related("category")[:CANDIDATES])
    topic = candidates[0] if candidates else None
    published = list(
        Article.objects.filter(status=Article.PUBLISHED)
        .select_related("category")
        .order_by("-published_at")
    )
    by_group = {}
    for a in published:
        by_group.setdefault(a.translation_group, {})[a.language] = _article_url(a)
    recent = [a for a in published if a.language == settings.DEFAULT_LOCALE]
    categories = ServiceCategory.objects.exclude(slug=OTHERS_SLUG)
    service_pages = {}
    for page in ServicePage.objects.filter(is_active=True).select_related("category"):
        service_pages.setdefault(page.category.slug, {})[page.language] = _site_url(f"/{page.language}/services/{page.slug}")
    return Response({
        "site": settings.SITE_NAME,
        "domain": settings.SITE_DOMAIN,
        "languages": settings.LOCALES,
        "pending_count": Topic.objects.filter(status=Topic.PENDING).count(),
        "topic": topic and _topic_json(topic),
        # tried in order by the writer; topics that duplicate an existing article are skipped
        "candidates": [_topic_json(t) for t in candidates],
        # real categories only: the writer must place every article in one of these
        "categories": [
            {"slug": c.slug, "name": c.name_for(settings.DEFAULT_LOCALE), "service_urls": service_pages.get(c.slug, {})}
            for c in categories
        ],
        # every published article (for duplicate checks + same-language internal links)
        "existing_articles": [
            {"title": a.title, "url": _article_url(a), "keyword": a.focus_keyword,
             "category": a.category.slug if a.category else None, "urls": by_group.get(a.translation_group, {})}
            for a in recent
        ],
    })


@content_endpoint(["POST"])
def create_drafts(request):
    data = request.data
    articles = data.get("articles")
    if not isinstance(articles, dict) or settings.DEFAULT_LOCALE not in articles:
        return Response(
            {"detail": f"`articles` must be an object keyed by language and include '{settings.DEFAULT_LOCALE}'."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    unknown = set(articles) - set(settings.LOCALES)
    if unknown:
        return Response({"detail": f"Unknown languages: {sorted(unknown)}"}, status=status.HTTP_400_BAD_REQUEST)
    images = {}
    for language, item in articles.items():
        error = _validate_article(language, item)
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
        try:
            images[language] = _validate_images(language, item.get("images"))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        skipped = _skip_topics(data.get("skipped_topics"))
        topic = None
        if data.get("topic_id") is not None:
            topic = Topic.objects.select_for_update().filter(pk=data["topic_id"]).first()
            if topic is None:
                return Response({"detail": "Topic not found."}, status=status.HTTP_404_NOT_FOUND)
            if topic.status != Topic.PENDING:
                return Response({"detail": f"Topic is {topic.status}, not pending."}, status=status.HTTP_409_CONFLICT)

        # Never file new articles under the hidden "others" category.
        candidates = [data.get("category"), topic.category.slug if topic and topic.category else None]
        category = next((c for c in (
            ServiceCategory.objects.filter(slug=slug).exclude(slug=OTHERS_SLUG).first() for slug in candidates if slug
        ) if c), None)
        if category is None:
            return Response({"detail": "`category` must be one of the real categories (not 'others')."},
                            status=status.HTTP_400_BAD_REQUEST)

        submission = Submission.objects.create(
            topic=topic, faq={lang: item.get("faq") or [] for lang, item in articles.items()}
        )
        created = []
        featured_urls = {}
        for language, item in articles.items():
            title = item["title"].strip()[:255]
            body = item["body_html"]
            featured = {}
            if images[language]:
                for key, raw, alt in images[language]["inline"]:
                    _name, url = _store_image(submission.id, language, key, raw)
                    body = body.replace("{{IMG:%s}}" % key, url)
                raw, alt = images[language]["featured"]
                name, featured_urls[language] = _store_image(submission.id, language, "featured", raw)
                featured = {"featured_image": name, "featured_image_alt": alt, "og_image": name}
            body = re.sub(r"<figure>\s*<img[^>]*\{\{IMG:[^}]*\}\}[^>]*>\s*</figure>", "", body)  # unused slots
            meta_title = str(item.get("meta_title") or "").strip() or title
            article = Article.objects.create(
                translation_group=submission.id,
                category=category,
                language=language,
                status=Article.DRAFT,
                title=title,
                slug=_unique_slug(item.get("slug"), title, language),
                body=body + _faq_html(language, item.get("faq")),
                **featured,
                meta_title=meta_title[:70],
                meta_description=item["meta_description"].strip()[:160],
                og_title=title[:70],
                og_description=item["excerpt"].strip()[:200],
                focus_keyword=str(item.get("focus_keyword") or (topic.keyword if topic else ""))[:80],
            )
            created.append(article)

        if topic:
            topic.status = Topic.USED
            topic.save(update_fields=["status", "updated_at"])

    return Response({
        "id": submission.id,
        "status": Submission.DRAFT,
        "preview_url": _site_url(f"/api/content/preview/{submission.preview_token}/"),
        "category": category.slug if category else None,
        "featured_images": featured_urls,
        "skipped_topics": skipped,
        "articles": [
            {"id": a.id, "language": a.language, "title": a.title, "slug": a.slug} for a in created
        ],
    }, status=status.HTTP_201_CREATED)


@content_endpoint(["POST"])
def publish_submission(request, pk):
    with transaction.atomic():
        submission = get_object_or_404(Submission.objects.select_for_update(), pk=pk)
        if submission.status == Submission.REJECTED:
            return Response({"detail": "Submission was rejected."}, status=status.HTTP_409_CONFLICT)
        articles = list(Article.objects.filter(translation_group=submission.id).order_by("language"))
        for article in articles:
            if article.status != Article.PUBLISHED:
                article.publish()
        submission.status = Submission.PUBLISHED
        submission.decided_at = submission.decided_at or timezone.now()
        submission.save(update_fields=["status", "decided_at"])

    urls = {a.language: _article_url(a) for a in articles}
    return Response({
        "id": submission.id,
        "status": Submission.PUBLISHED,
        "url": urls.get(settings.DEFAULT_LOCALE) or next(iter(urls.values()), None),
        "urls": urls,
    })


@content_endpoint(["POST"])
def reject_submission(request, pk):
    with transaction.atomic():
        submission = get_object_or_404(Submission.objects.select_for_update(), pk=pk)
        if submission.status != Submission.DRAFT:
            return Response({"detail": f"Submission is {submission.status}."}, status=status.HTTP_409_CONFLICT)
        reason = str(request.data.get("reason") or "").strip()
        # Drafts were never public; remove them (and their image files) so their slugs are freed.
        drafts = Article.objects.filter(translation_group=submission.id, status=Article.DRAFT)
        _delete_images(submission.id, list(drafts))
        drafts.delete()
        submission.status = Submission.REJECTED
        submission.reject_reason = reason
        submission.decided_at = timezone.now()
        submission.save(update_fields=["status", "reject_reason", "decided_at"])

        topic = submission.topic
        if topic:
            topic.reject_count += 1
            if topic.reject_count >= MAX_REJECTIONS:
                topic.status = Topic.SKIPPED
            else:
                topic.status = Topic.PENDING
                if reason:
                    topic.notes = f"{topic.notes}\nPrevious draft was rejected because: {reason}".strip()
            topic.save(update_fields=["status", "reject_count", "notes", "updated_at"])

    return Response({
        "id": submission.id,
        "status": Submission.REJECTED,
        "topic_status": topic.status if topic else None,
    })


@content_endpoint(["POST"])
def skip_topics(request):
    """The writer found these topics already covered: never write them, remember why."""
    with transaction.atomic():
        skipped = _skip_topics(request.data.get("topics"))
    return Response({"skipped": skipped, "pending_count": Topic.objects.filter(status=Topic.PENDING).count()})


def preview(request, token):
    submission = get_object_or_404(Submission, preview_token=token)
    order = {lang: i for i, lang in enumerate(settings.LOCALES)}
    articles = sorted(
        Article.objects.filter(translation_group=submission.id).select_related("category"),
        key=lambda a: order.get(a.language, 99),
    )
    response = render(request, "content_api/preview.html", {
        "submission": submission,
        "articles": [{"obj": a, "rtl": a.language in RTL} for a in articles],
        "site_name": settings.SITE_NAME,
    })
    response["X-Robots-Tag"] = "noindex, nofollow"
    return response
