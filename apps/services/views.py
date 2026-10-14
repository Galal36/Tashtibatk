from django.db.models import Count
from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.accounts.permissions import ReadOnlyOrStaff

from .models import ServiceCategory, ServicePage
from .serializers import (
    ServiceCategoryAdminSerializer,
    ServiceCategorySerializer,
    ServicePageSerializer,
)


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.all()
    permission_classes = [ReadOnlyOrStaff]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    lookup_field = "slug"

    def get_serializer_class(self):
        # Authenticated staff get the full admin payload (all locales, SEO, counts).
        if self.request.user and self.request.user.is_authenticated:
            return ServiceCategoryAdminSerializer
        return ServiceCategorySerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["locale"] = self.request.query_params.get("lang", "en")
        return ctx

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user and self.request.user.is_authenticated:
            # admin list needs per-category article counts
            return qs.annotate(article_count=Count("articles")).order_by("display_order")
        # public reads only see active categories
        return qs.filter(is_active=True)


class ServicePageViewSet(viewsets.ModelViewSet):
    queryset = ServicePage.objects.select_related("category").all()
    serializer_class = ServicePageSerializer
    permission_classes = [ReadOnlyOrStaff]
    lookup_field = "slug"

    def get_queryset(self):
        qs = super().get_queryset()
        lang = self.request.query_params.get("lang")
        if lang:
            qs = qs.filter(language=lang)
        if not (self.request.user and self.request.user.is_authenticated):
            qs = qs.filter(is_active=True)
        return qs
