from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminOrModerator

from .models import MediaAsset
from .serializers import MediaAssetSerializer


class MediaAssetViewSet(viewsets.ModelViewSet):
    """Media Library — staff-only image management."""

    queryset = MediaAsset.objects.select_related("uploaded_by").all()
    serializer_class = MediaAssetSerializer
    permission_classes = [IsAdminOrModerator]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(title__icontains=q)
        ordering = self.request.query_params.get("ordering")
        if ordering in {"created_at", "-created_at", "title", "-title"}:
            qs = qs.order_by(ordering)
        return qs

    def create(self, request, *args, **kwargs):
        """Single or bulk upload. Bulk: send repeated `files` form entries."""
        files = request.FILES.getlist("files")
        if not files:
            return super().create(request, *args, **kwargs)

        created, errors = [], []
        for f in files:
            serializer = self.get_serializer(data={"file": f})
            if serializer.is_valid():
                serializer.save()
                created.append(serializer.data)
            else:
                errors.append({"name": f.name, "errors": serializer.errors})
        return Response(
            {"created": created, "errors": errors},
            status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST,
        )
