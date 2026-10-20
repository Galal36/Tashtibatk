from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.http import HttpResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import UserViewSet, csrf, login_view, logout_view, me
from apps.articles.sitemaps import sitemaps
from apps.articles.views import ArticleViewSet
from apps.contacts.views import ContactAdminViewSet, PublicContactViewSet
from apps.media.views import MediaAssetViewSet
from apps.services.views import ServiceCategoryViewSet, ServicePageViewSet

router = DefaultRouter()
router.register("articles", ArticleViewSet, basename="article")
router.register("categories", ServiceCategoryViewSet, basename="category")
router.register("service-pages", ServicePageViewSet, basename="servicepage")
router.register("contact", PublicContactViewSet, basename="contact")
router.register("contacts", ContactAdminViewSet, basename="contact-admin")
router.register("media", MediaAssetViewSet, basename="media")
router.register("users", UserViewSet, basename="user")


def robots_txt(request):
    content = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /dashboard/\n"
        "Disallow: /ar/admin\n"
        "Disallow: /en/admin\n"
        "Disallow: /ur/admin\n"
        "Disallow: /api/\n"
        "Disallow: /admin/\n\n"
        f"Sitemap: {settings.SITE_DOMAIN.rstrip('/')}/sitemap.xml\n"
    )
    return HttpResponse(content, content_type="text/plain")


api_auth = [
    path("auth/csrf/", csrf),
    path("auth/login/", login_view),
    path("auth/logout/", logout_view),
    path("auth/me/", me),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/content/", include("apps.content_api.urls")),
    path("api/", include(api_auth)),
    path("api/", include(router.urls)),
    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="sitemap"),
    path("robots.txt", robots_txt),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
