from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.articles.models import Article


class Command(BaseCommand):
    help = "Publish scheduled articles whose publish time has arrived."

    def handle(self, *args, **options):
        now = timezone.now()
        due = Article.objects.filter(
            status=Article.SCHEDULED, published_at__lte=now
        )
        count = 0
        for article in due:
            article.status = Article.PUBLISHED
            article.save(update_fields=["status", "updated_at"])
            count += 1
        self.stdout.write(
            self.style.SUCCESS(f"Published {count} scheduled article(s).")
        )
