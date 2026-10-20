from django.test import TestCase
from rest_framework.test import APIClient

from apps.articles.models import Article
from apps.services.models import ServiceCategory

from .models import Submission, Topic

TOKEN = {"HTTP_X_CONTENT_TOKEN": "test-token"}


def article(lang, **extra):
    data = {
        "title": f"Title {lang}",
        "slug": "kitchen-plumbing-tips",
        "meta_description": "Meta " * 50,
        "excerpt": f"Excerpt {lang}",
        "body_html": "<h2>Intro</h2><p>Body</p><script>alert(1)</script>",
        "faq": [{"q": "Q1?", "a": "A1"}],
    }
    data.update(extra)
    return data


class ContentApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.plumbing = ServiceCategory.objects.create(
            slug="plumbing", name_ar="سباكة", name_en="Plumbing", name_ur="پلمبنگ"
        )
        ServiceCategory.objects.create(
            slug="others", name_ar="أخرى", name_en="Others", name_ur="دیگر", is_active=False
        )
        self.topic = Topic.objects.create(title="تسريب المياه", category=self.plumbing, priority=5)

    def create(self, **extra):
        body = {"topic_id": self.topic.id, "articles": {l: article(l) for l in ("ar", "en", "ur")}}
        body.update(extra)
        return self.client.post("/api/content/articles/", body, format="json", **TOKEN)

    def test_auth_required(self):
        self.assertEqual(self.client.get("/api/content/next/").status_code, 403)
        bad = self.client.get("/api/content/next/", HTTP_X_CONTENT_TOKEN="wrong")
        self.assertEqual(bad.status_code, 403)
        self.assertEqual(self.client.post("/api/content/articles/", {}, format="json").status_code, 403)

    def test_next_returns_highest_priority_pending(self):
        Topic.objects.create(title="low", priority=1)
        res = self.client.get("/api/content/next/", **TOKEN)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["topic"]["id"], self.topic.id)
        self.assertEqual(res.data["topic"]["category"], "plumbing")
        self.assertEqual(res.data["pending_count"], 2)

    def test_empty_queue(self):
        Topic.objects.all().update(status=Topic.USED)
        res = self.client.get("/api/content/next/", **TOKEN)
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data["topic"])

    def test_create_drafts_then_publish(self):
        res = self.create()
        self.assertEqual(res.status_code, 201, res.data)
        group = res.data["id"]
        arts = Article.objects.filter(translation_group=group)
        self.assertEqual(arts.count(), 3)
        self.assertTrue(all(a.status == Article.DRAFT and a.category == self.plumbing for a in arts))
        ar = arts.get(language="ar")
        self.assertNotIn("<script", ar.body)
        self.assertIn("الأسئلة الشائعة", ar.body)
        self.assertEqual(len(ar.meta_description), 160)
        self.topic.refresh_from_db()
        self.assertEqual(self.topic.status, Topic.USED)

        token = Submission.objects.get(pk=group).preview_token
        preview = self.client.get(f"/api/content/preview/{token}/")
        self.assertEqual(preview.status_code, 200)
        self.assertEqual(preview["X-Robots-Tag"], "noindex, nofollow")
        self.assertContains(preview, "Title en")

        pub = self.client.post(f"/api/content/articles/{group}/publish/", **TOKEN)
        self.assertEqual(pub.status_code, 200)
        self.assertEqual(pub.data["url"], "https://example.test/ar/articles/kitchen-plumbing-tips")
        self.assertEqual(set(pub.data["urls"]), {"ar", "en", "ur"})
        self.assertFalse(Article.objects.filter(translation_group=group, status=Article.DRAFT).exists())

    def test_slug_unique_per_language(self):
        self.create()
        second = Topic.objects.create(title="second", category=self.plumbing)
        res = self.create(topic_id=second.id)
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["articles"][0]["slug"], "kitchen-plumbing-tips-2")

    def test_used_topic_conflict(self):
        self.create()
        self.assertEqual(self.create().status_code, 409)

    def test_validation(self):
        res = self.client.post(
            "/api/content/articles/",
            {"topic_id": self.topic.id, "articles": {"ar": article("ar", body_html="")}},
            format="json", **TOKEN,
        )
        self.assertEqual(res.status_code, 400)
        res = self.client.post(
            "/api/content/articles/", {"articles": {"en": article("en")}}, format="json", **TOKEN
        )
        self.assertEqual(res.status_code, 400)  # default language missing

    def test_reject_requeues_then_skips(self):
        group = self.create().data["id"]
        res = self.client.post(f"/api/content/articles/{group}/reject/", {"reason": "too generic"}, format="json", **TOKEN)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["topic_status"], Topic.PENDING)
        self.assertFalse(Article.objects.filter(translation_group=group).exists())
        self.topic.refresh_from_db()
        self.assertIn("too generic", self.topic.notes)

        group2 = self.create().data["id"]
        res = self.client.post(f"/api/content/articles/{group2}/reject/", format="json", **TOKEN)
        self.assertEqual(res.data["topic_status"], Topic.SKIPPED)
        # a rejected set can't be published
        self.assertEqual(self.client.post(f"/api/content/articles/{group2}/publish/", **TOKEN).status_code, 409)

    def test_unknown_category_falls_back_to_others(self):
        res = self.create(category="nope")
        self.assertEqual(res.data["category"], "others")
