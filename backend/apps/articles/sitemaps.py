"""
Sitemaps that emit <xhtml:link rel="alternate" hreflang="..."> entries so
Google understands the AR/EN/UR versions of each topic are one piece of
content. Absolute URLs are built from settings.SITE_DOMAIN (the public
Next.js origin), since the frontend — not Django — owns these routes.
"""
from django.conf import settings
from django.contrib.sitemaps import Sitemap

from apps.services.models import ServicePage

from .models import Article


def _abs(path):
    return f"{settings.SITE_DOMAIN.rstrip('/')}{path}"


class _BaseSitemap(Sitemap):
    protocol = "https"

    def get_urls(self, page=1, site=None, protocol=None):
        # Bypass django.contrib.sites; we render absolute URLs ourselves.
        urls = []
        for item in self.paginator.page(page).object_list:
            loc = _abs(self.location(item))
            urls.append({
                "item": item,
                "location": loc,
                "lastmod": self.lastmod(item) if hasattr(self, "lastmod") else None,
                "changefreq": self.changefreq,
                "priority": str(self.priority),
                "alternates": self.alternates_for(item),
            })
        return urls

    def alternates_for(self, item):
        return []


class ArticleSitemap(_BaseSitemap):
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return Article.objects.filter(status=Article.PUBLISHED).order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f"/{obj.language}/articles/{obj.slug}"

    def alternates_for(self, obj):
        siblings = Article.objects.filter(
            translation_group=obj.translation_group, status=Article.PUBLISHED
        )
        return [
            {"location": _abs(f"/{s.language}/articles/{s.slug}"), "lang_code": s.language}
            for s in siblings
        ]


class ServicePageSitemap(_BaseSitemap):
    changefreq = "monthly"
    priority = 0.9

    def items(self):
        return ServicePage.objects.filter(is_active=True).select_related("category")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f"/{obj.language}/services/{obj.slug}"

    def alternates_for(self, obj):
        siblings = ServicePage.objects.filter(category=obj.category, is_active=True)
        return [
            {"location": _abs(f"/{s.language}/services/{s.slug}"), "lang_code": s.language}
            for s in siblings
        ]


sitemaps = {
    "articles": ArticleSitemap,
    "services": ServicePageSitemap,
}
