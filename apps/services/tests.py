from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APIClient

from .models import ServiceCategory, ServicePage
from .serializers import ServicePageSerializer


class ServicePageBodyFaqTests(TestCase):
    def setUp(self):
        self.cat = ServiceCategory.objects.create(slug="apartment-finishing", name_ar="ت", name_en="F", name_ur="F")

    def test_body_is_sanitized_and_img_attrs_kept(self):
        p = ServicePage.objects.create(
            category=self.cat, language="ar", slug="apartment-finishing", title="t",
            body='<p onclick="x()">hi</p><script>alert(1)</script>'
                 '<img src="/media/services/a.webp" alt="a" width="1200" height="675" loading="lazy">',
        )
        self.assertNotIn("script", p.body)
        self.assertNotIn("onclick", p.body)
        for attr in ('width="1200"', 'height="675"', 'loading="lazy"', 'alt="a"'):
            self.assertIn(attr, p.body)

    def test_faq_tags_stripped_and_defaults(self):
        p = ServicePage.objects.create(category=self.cat, language="en", slug="apartment-finishing", title="t",
                                       faq=[{"q": "<b>Q?</b>", "a": "A <script>x</script>"}])
        self.assertEqual(p.faq, [{"q": "Q?", "a": "A x"}])
        empty = ServicePage.objects.create(category=self.cat, language="ur", slug="apartment-finishing", title="t")
        self.assertEqual((empty.body, empty.faq), ("", []))

    def test_faq_validation(self):
        with self.assertRaises(ValidationError):
            ServicePage(faq=[{"q": "only question"}]).clean()
        s = ServicePageSerializer(data={"category": self.cat.id, "language": "ar", "slug": "x", "title": "t", "faq": "nope"})
        self.assertFalse(s.is_valid())
        self.assertIn("faq", s.errors)

    def test_api_exposes_body_and_faq(self):
        ServicePage.objects.create(category=self.cat, language="ar", slug="apartment-finishing", title="t",
                                   body="<p>x</p>", faq=[{"q": "Q", "a": "A"}])
        r = APIClient().get("/api/service-pages/apartment-finishing/?lang=ar")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["body"], "<p>x</p>")
        self.assertEqual(r.json()["faq"], [{"q": "Q", "a": "A"}])
