from django.conf import settings
from django.core.mail import send_mail
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminOrModerator

from .models import ContactForm
from .serializers import ContactAdminSerializer, ContactCreateSerializer


class PublicContactViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Anonymous endpoint for the website contact form."""

    queryset = ContactForm.objects.all()
    serializer_class = ContactCreateSerializer
    permission_classes = []  # public

    def perform_create(self, serializer):
        contact = serializer.save()
        self._notify(contact)

    def _notify(self, contact):
        recipient = getattr(settings, "CONTACT_NOTIFY_EMAIL", "")
        if not recipient:
            return
        send_mail(
            subject=f"[{settings.SITE_NAME}] New enquiry: {contact.service_interest or 'general'}",
            message=(
                f"Name: {contact.full_name}\nPhone: {contact.phone}\n"
                f"Email: {contact.email}\nCountry: {contact.country}\n"
                f"Service: {contact.service_interest}\n\n{contact.message}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=True,
        )


class ContactAdminViewSet(viewsets.ModelViewSet):
    """Dashboard: list/read/triage enquiries. Staff only."""

    queryset = ContactForm.objects.select_related("assigned_to").all()
    serializer_class = ContactAdminSerializer
    permission_classes = [IsAdminOrModerator]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("status"):
            qs = qs.filter(status=params["status"])
        if params.get("unread") == "1":
            qs = qs.filter(is_read=False)
        return qs

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_read:
            instance.is_read = True
            instance.save(update_fields=["is_read"])
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        return Response({"unread": self.get_queryset().filter(is_read=False).count()})
