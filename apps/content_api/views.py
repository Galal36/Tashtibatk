"""
Token-protected content API used by n8n. Same contract on every site:

  GET  /api/content/next/                     next pending topic + context
  POST /api/content/articles/                 create AR/EN/UR drafts
  POST /api/content/articles/<id>/publish/    publish the whole set
  POST /api/content/articles/<id>/reject/     reject the whole set
  GET  /api/content/preview/<token>/          noindex preview (no auth; unguessable token)
"""
import hmac
import uuid

from django.conf import settings
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
from apps.services.models import ServiceCategory

from .models import Submission, Topic

OTHERS_SLUG = "others"
REQUIRED_FIELDS = ("title", "slug", "meta_description", "excerpt", "body_html")
FAQ_HEADING = {"ar": "الأسئلة الشائعة", "en": "Frequently Asked Questions", "ur": "اکثر پوچھے جانے والے سوالات"}
RTL = {"ar", "ur"}
# After this many rejections a topic is skipped instead of re-queued.
MAX_REJECTIONS = 2


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


@content_endpoint(["GET"])
def next_topic(request):
    topic = Topic.objects.filter(status=Topic.PENDING).select_related("category").first()
    recent = (
        Article.objects.filter(status=Article.PUBLISHED, language=settings.DEFAULT_LOCALE)
        .select_related("category")
        .order_by("-published_at")[:40]
    )
    categories = ServiceCategory.objects.all()
    return Response({
        "site": settings.SITE_NAME,
        "domain": settings.SITE_DOMAIN,
        "languages": settings.LOCALES,
        "pending_count": Topic.objects.filter(status=Topic.PENDING).count(),
        "topic": topic and {
            "id": topic.id,
            "title": topic.title,
            "keyword": topic.keyword,
            "notes": topic.notes,
            "category": topic.category.slug if topic.category else OTHERS_SLUG,
        },
        "categories": [{"slug": c.slug, "name": c.name_for(settings.DEFAULT_LOCALE)} for c in categories],
        "existing_articles": [
            {"title": a.title, "url": _article_url(a), "category": a.category.slug if a.category else None}
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
    for language, item in articles.items():
        error = _validate_article(language, item)
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        topic = None
        if data.get("topic_id") is not None:
            topic = Topic.objects.select_for_update().filter(pk=data["topic_id"]).first()
            if topic is None:
                return Response({"detail": "Topic not found."}, status=status.HTTP_404_NOT_FOUND)
            if topic.status != Topic.PENDING:
                return Response({"detail": f"Topic is {topic.status}, not pending."}, status=status.HTTP_409_CONFLICT)

        category_slug = data.get("category") or (topic.category.slug if topic and topic.category else OTHERS_SLUG)
        category = ServiceCategory.objects.filter(slug=category_slug).first() \
            or ServiceCategory.objects.filter(slug=OTHERS_SLUG).first()

        submission = Submission.objects.create(
            topic=topic, faq={lang: item.get("faq") or [] for lang, item in articles.items()}
        )
        created = []
        for language, item in articles.items():
            title = item["title"].strip()[:255]
            article = Article.objects.create(
                translation_group=submission.id,
                category=category,
                language=language,
                status=Article.DRAFT,
                title=title,
                slug=_unique_slug(item.get("slug"), title, language),
                body=item["body_html"] + _faq_html(language, item.get("faq")),
                meta_title=title[:70],
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
        # Drafts were never public; remove them so their slugs are freed.
        Article.objects.filter(translation_group=submission.id, status=Article.DRAFT).delete()
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
