from django.contrib import admin

from .models import ServiceCategory, ServicePage


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_ar", "slug", "display_order", "is_active")
    list_editable = ("display_order", "is_active")
    prepopulated_fields = {"slug": ("name_en",)}
    search_fields = ("name_en", "name_ar", "name_ur", "slug")


@admin.register(ServicePage)
class ServicePageAdmin(admin.ModelAdmin):
    list_display = ("title", "language", "category", "is_active", "updated_at")
    list_filter = ("language", "is_active", "category")
    search_fields = ("title", "slug")
