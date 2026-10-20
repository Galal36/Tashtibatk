"""
On publish/update of content, ping the Next.js revalidate webhook so the
statically generated (ISR) pages refresh immediately instead of waiting for
their timed revalidation. Failures are swallowed — content still saves.
"""
import json
import urllib.error
import urllib.request

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.services.models import ServicePage

from .models import Article


def _ping(paths):
    url = getattr(settings, "REVALIDATE_URL", "")
    secret = getattr(settings, "REVALIDATE_SECRET", "")
    if not url or not secret:
        return
    payload = json.dumps({"secret": secret, "paths": paths}).encode()
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        urllib.request.urlopen(req, timeout=3)
    except (urllib.error.URLError, OSError):
        pass  # best-effort; never block the save


@receiver(post_save, sender=Article)
def revalidate_article(sender, instance, **kwargs):
    if instance.status == Article.PUBLISHED:
        _ping([
            f"/{instance.language}/articles/{instance.slug}",
            f"/{instance.language}/articles",  # the listing page must refresh too
            f"/{instance.language}",
        ])


@receiver(post_save, sender=ServicePage)
def revalidate_service_page(sender, instance, **kwargs):
    if instance.is_active:
        _ping([
            f"/{instance.language}/services/{instance.slug}",
            f"/{instance.language}/services",  # the listing page must refresh too
            f"/{instance.language}",
        ])
