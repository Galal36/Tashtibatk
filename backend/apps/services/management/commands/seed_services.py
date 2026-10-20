from django.core.management.base import BaseCommand

from apps.services.models import ServiceCategory

# Trilingual seed for the launch service set. en/ur are editable later in the
# dashboard; nothing here is country-specific.
SERVICES = [
    ("apartment-finishing", "تشطيبات شقق من البداية للنهاية", "Apartment Finishing (Turnkey)", "اپارٹمنٹ کی مکمل تکمیل", "home"),
    ("plumbing", "سباكة", "Plumbing", "پلمبنگ", "droplet"),
    ("carpentry", "نجارة", "Carpentry", "بڑھئی کا کام", "hammer"),
    ("montage", "المونتال", "Montage & Installation", "اسمبلی اور تنصیب", "wrench"),
    ("furniture-moving", "نقل عفش", "Furniture Moving", "فرنیچر کی منتقلی", "truck"),
    ("landscaping", "تجميل حدائق وزراعة نباتات", "Landscaping & Planting", "باغبانی اور پودے لگانا", "leaf"),
    ("house-cleaning", "تنظيف منازل", "House Cleaning", "گھر کی صفائی", "sparkles"),
    ("heavy-equipment-rental", "معدات ثقيلة للايجار", "Heavy Equipment Rental", "بھاری مشینری کرایہ پر", "forklift"),
]


class Command(BaseCommand):
    help = "Seed the initial service categories (idempotent)."

    def handle(self, *args, **options):
        created = 0
        for order, (slug, ar, en, ur, icon) in enumerate(SERVICES):
            obj, was_created = ServiceCategory.objects.update_or_create(
                slug=slug,
                defaults={
                    "name_ar": ar, "name_en": en, "name_ur": ur,
                    "icon": icon, "display_order": order, "is_active": True,
                },
            )
            created += int(was_created)
            self.stdout.write(("＋ " if was_created else "· ") + f"{slug} — {en}")
        self.stdout.write(self.style.SUCCESS(f"Done. {created} created, {len(SERVICES) - created} updated."))
