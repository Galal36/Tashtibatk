import uuid

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminOrModerator, ReadOnlyOrStaff
from apps.services.models import ServiceCategory

from .models import Article
from .serializers import ArticleDetailSerializer, ArticleListSerializer


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.select_related("author", "category").all()
    permission_classes = [ReadOnlyOrStaff]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    lookup_field = "slug"

    # Whitelisted sort fields (incoming `ordering` param is validated against this).
    ORDERING_FIELDS = {
        "published_at", "-published_at", "updated_at", "-updated_at",
        "title", "-title", "created_at", "-created_at",
    }

    def get_serializer_class(self):
        return ArticleListSerializer if self.action == "list" else ArticleDetailSerializer

    def get_object(self):
        """Look up by UUID id (admin) or by slug (+optional ?lang, public).
        Slugs are only unique per language, so the admin always uses the id."""
        lookup = self.kwargs.get(self.lookup_field)
        qs = self.filter_queryset(self.get_queryset())
        try:
            uuid.UUID(str(lookup))
            obj = get_object_or_404(qs, id=lookup)
        except ValueError:
            obj = get_object_or_404(qs, slug=lookup)
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        authed = bool(self.request.user and self.request.user.is_authenticated)

        # public (anonymous) callers only ever see published content
        if not authed:
            qs = qs.filter(status=Article.PUBLISHED)
        elif params.get("status"):
            qs = qs.filter(status=params["status"])

        if params.get("lang"):
            qs = qs.filter(language=params["lang"])
        if params.get("category"):
            qs = qs.filter(category__slug=params["category"])
        if params.get("author"):
            qs = qs.filter(author_id=params["author"])
        if params.get("search"):
            qs = qs.filter(title__icontains=params["search"])

        ordering = params.get("ordering")
        if ordering in self.ORDERING_FIELDS:
            qs = qs.order_by(ordering)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"])
    def publish(self, request, slug=None):
        article = self.get_object()
        article.publish()
        return Response(ArticleDetailSerializer(article, context={"request": request}).data)

    @action(detail=False, methods=["get"], permission_classes=[IsAdminOrModerator])
    def stats(self, request):
        """Dashboard home counters + recent published articles."""
        qs = Article.objects.all()
        recent = (
            qs.filter(status=Article.PUBLISHED)
            .select_related("category", "author")
            .order_by("-published_at")[:5]
        )
        return Response({
            "total": qs.count(),
            "published": qs.filter(status=Article.PUBLISHED).count(),
            "draft": qs.filter(status=Article.DRAFT).count(),
            "scheduled": qs.filter(status=Article.SCHEDULED).count(),
            "categories": ServiceCategory.objects.count(),
            "recent": ArticleListSerializer(
                recent, many=True, context={"request": request}
            ).data,
        })

    @action(detail=False, methods=["post"])
    def bulk(self, request):
        """Bulk publish / unpublish / delete. Body: {ids: [...], action: "..."}."""
        ids = request.data.get("ids") or []
        op = request.data.get("action")
        if not ids or op not in {"publish", "unpublish", "delete"}:
            return Response(
                {"detail": "Provide `ids` and a valid `action`."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = Article.objects.filter(id__in=ids)
        if op == "delete":
            count, _ = qs.delete()
        elif op == "publish":
            count = 0
            for art in qs:
                if art.status != Article.PUBLISHED:
                    art.status = Article.PUBLISHED
                    if not art.published_at:
                        art.published_at = timezone.now()
                    art.save(update_fields=["status", "published_at", "updated_at"])
                count += 1
        else:  # unpublish
            count = qs.update(status=Article.DRAFT)
        return Response({"updated": count, "action": op})
