from rest_framework import serializers

from .models import ContactForm


class ContactCreateSerializer(serializers.ModelSerializer):
    """Public submission — only the lead's own fields are writable."""

    class Meta:
        model = ContactForm
        fields = [
            "id", "full_name", "phone", "email",
            "service_interest", "country", "message",
        ]
        read_only_fields = ["id"]


class ContactAdminSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(
        source="assigned_to.full_name", read_only=True
    )

    class Meta:
        model = ContactForm
        fields = [
            "id", "full_name", "phone", "email", "service_interest", "country",
            "message", "status", "is_read", "assigned_to", "assigned_to_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
