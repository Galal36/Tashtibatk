from django.contrib import admin

from .models import ContactForm


@admin.register(ContactForm)
class ContactFormAdmin(admin.ModelAdmin):
    list_display = ("full_name", "phone", "service_interest", "country", "status", "is_read", "created_at")
    list_filter = ("status", "is_read", "country", "service_interest")
    search_fields = ("full_name", "phone", "email", "message")
    readonly_fields = ("created_at",)
    list_editable = ("status", "is_read")
