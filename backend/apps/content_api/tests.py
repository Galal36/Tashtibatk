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

    def test_unknown_category_falls_back_to_topic_category(self):
        res = self.create(category="no-such-category")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["category"], "plumbing")

    def test_others_category_is_refused(self):
        others_topic = Topic.objects.create(title="موضوع عام", category=ServiceCategory.objects.get(slug="others"))
        res = self.create(topic_id=others_topic.id, category="others")
        self.assertEqual(res.status_code, 400)
        res = self.create(topic_id=others_topic.id, category="plumbing")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["category"], "plumbing")

    def test_next_topic_lists_real_categories_and_translations(self):
        res = self.client.get("/api/content/next/", **TOKEN)
        self.assertNotIn("others", [c["slug"] for c in res.data["categories"]])
        sub = self.create().data
        self.client.post(f"/api/content/articles/{sub['id']}/publish/", **TOKEN)
        res = self.client.get("/api/content/next/", **TOKEN)
        item = res.data["existing_articles"][0]
        self.assertEqual(set(item["urls"]), {"ar", "en", "ur"})

    def test_skip_topics_and_candidates(self):
        second = Topic.objects.create(title="انسداد المجاري", category=self.plumbing, priority=4)
        res = self.client.get("/api/content/next/", **TOKEN)
        self.assertEqual([c["id"] for c in res.data["candidates"]], [self.topic.id, second.id])
        res = self.client.post("/api/content/topics/skip/", {"topics": [{"id": self.topic.id, "reason": "duplicate of /ar/articles/x"}]},
                               format="json", **TOKEN)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["skipped"]), 1)
        self.topic.refresh_from_db()
        self.assertEqual(self.topic.status, Topic.SKIPPED)
        self.assertIn("duplicate of /ar/articles/x", self.topic.notes)
        # drafts for the 2nd candidate also mark the skipped one (idempotent)
        res = self.create(topic_id=second.id, skipped_topics=[{"id": self.topic.id, "reason": "again"}])
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["skipped_topics"], [])

def webp(color=(200, 100, 50), size=(1200, 675), fmt="WEBP"):
    import base64, io
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, fmt)
    return base64.b64encode(buf.getvalue()).decode()


class ContentApiImageTests(ContentApiTests):
    def setUp(self):
        import tempfile
        from django.test import override_settings
        super().setUp()
        self.media = tempfile.mkdtemp()
        self.override = override_settings(MEDIA_ROOT=self.media)
        self.override.enable()

    def tearDown(self):
        import shutil
        self.override.disable()
        shutil.rmtree(self.media, ignore_errors=True)

    def with_images(self, lang, inline=1):
        body = '<p>Intro</p><figure><img src="{{IMG:inline1}}" alt="x" width="1200" height="675" loading="lazy"></figure>' \
               '<h2>Two</h2><figure><img src="{{IMG:inline2}}" alt="y" width="1200" height="675" loading="lazy"></figure><p>End</p>'
        images = {"featured": {"data": webp(), "alt": f"featured {lang}"},
                  "inline": [{"key": "inline1", "data": webp((10, 20, 30)), "alt": "x"}][:inline]}
        return article(lang, body_html=body, images=images, meta_title=f"Meta {lang} | Tashtibatk")

    def test_images_stored_and_linked(self):
        import os
        res = self.create(articles={l: self.with_images(l) for l in ("ar", "en", "ur")})
        self.assertEqual(res.status_code, 201, res.data)
        a = Article.objects.get(translation_group=res.data["id"], language="ar")
        self.assertEqual(a.featured_image_alt, "featured ar")
        self.assertEqual(a.og_image.name, a.featured_image.name)
        self.assertTrue(os.path.exists(a.featured_image.path))
        self.assertIn("/media/articles/auto/", a.body)
        self.assertIn('loading="lazy"', a.body)
        self.assertNotIn("{{IMG", a.body)                 # unused slot (inline2) removed
        self.assertEqual(a.meta_title, "Meta ar | Tashtibatk")
        self.assertIn("ar", res.data["featured_images"])
        # reject removes the files
        folder = os.path.dirname(a.featured_image.path)
        self.client.post(f"/api/content/articles/{res.data['id']}/reject/", format="json", **TOKEN)
        self.assertFalse(os.path.exists(folder))

    def test_bad_images_refused(self):
        bad = self.with_images("ar")
        bad["images"]["featured"]["data"] = webp(size=(800, 600))
        self.assertEqual(self.create(articles={"ar": bad}).status_code, 400)
        bad["images"]["featured"]["data"] = webp(fmt="PNG")
        self.assertEqual(self.create(articles={"ar": bad}).status_code, 400)
        bad["images"]["featured"] = {"data": "not base64!!", "alt": "a"}
        self.assertEqual(self.create(articles={"ar": bad}).status_code, 400)
        self.assertEqual(Submission.objects.count(), 0)
