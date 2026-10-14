"""
Seed one ServicePage per (category, language) with real marketing copy.
Idempotent: re-running updates existing rows in place. Pages reuse the
category slug so the frontend's /services/<category-slug> links resolve.
"""
from django.core.management.base import BaseCommand

from apps.services.models import ServiceCategory, ServicePage

# Per-category intro copy (the body's first paragraph) for each language.
INTRO = {
    "apartment-finishing": {
        "en": "Complete turnkey apartment finishing in Kuwait — from design and gypsum work to painting, flooring and the final handover. We deliver a move-in-ready home built to a high standard.",
        "ar": "تشطيب شقق متكامل في الكويت من الألف إلى الياء — من التصميم وأعمال الجبس إلى الدهانات والأرضيات والتسليم النهائي. نسلّمك منزلاً جاهزاً للسكن بأعلى جودة.",
        "ur": "کویت میں مکمل ٹرن کی اپارٹمنٹ فنشنگ — ڈیزائن اور جپسم کے کام سے لے کر پینٹنگ، فرش اور حتمی حوالگی تک۔ ہم اعلیٰ معیار کا رہائش کے لیے تیار گھر فراہم کرتے ہیں۔",
    },
    "plumbing": {
        "en": "Professional plumbing services in Kuwait — installations, leak detection, repairs and full bathroom and kitchen plumbing. Fast, clean work by experienced plumbers.",
        "ar": "خدمات سباكة احترافية في الكويت — تركيبات، كشف تسربات، إصلاحات، وسباكة كاملة للحمامات والمطابخ. عمل سريع ونظيف على يد فنيين خبراء.",
        "ur": "کویت میں پیشہ ورانہ پلمبنگ خدمات — تنصیب، لیک کا پتہ لگانا، مرمت اور باتھ روم و کچن کی مکمل پلمبنگ۔ تجربہ کار پلمبرز کا تیز اور صاف کام۔",
    },
    "carpentry": {
        "en": "Skilled carpentry in Kuwait — custom doors, wardrobes, kitchens and furniture repair. Precise woodwork tailored to your space.",
        "ar": "نجارة ماهرة في الكويت — أبواب وخزائن ومطابخ حسب الطلب وإصلاح الأثاث. أعمال خشبية دقيقة تناسب مساحتك.",
        "ur": "کویت میں ماہر بڑھئی کا کام — کسٹم دروازے، الماریاں، کچن اور فرنیچر کی مرمت۔ آپ کی جگہ کے مطابق درست لکڑی کا کام۔",
    },
    "montage": {
        "en": "Montage and installation services in Kuwait — assembling and mounting furniture, fixtures, appliances and fittings quickly and correctly.",
        "ar": "خدمات مونتاج وتركيب في الكويت — تجميع وتركيب الأثاث والتجهيزات والأجهزة بسرعة وإتقان.",
        "ur": "کویت میں اسمبلی اور تنصیب کی خدمات — فرنیچر، فکسچرز اور آلات کی تیز اور درست تنصیب۔",
    },
    "furniture-moving": {
        "en": "Reliable furniture moving in Kuwait — careful packing, dismantling, transport and reassembly. We move your home or office safely and on time.",
        "ar": "نقل عفش موثوق في الكويت — تغليف وفك وتركيب ونقل بعناية. ننقل منزلك أو مكتبك بأمان وفي الوقت المحدد.",
        "ur": "کویت میں قابل اعتماد فرنیچر کی منتقلی — احتیاط سے پیکنگ، کھولنا، نقل و حمل اور دوبارہ ترتیب۔ ہم آپ کے گھر یا دفتر کو محفوظ اور بروقت منتقل کرتے ہیں۔",
    },
    "landscaping": {
        "en": "Landscaping and planting in Kuwait — garden design, lawns, irrigation and plant care that brings your outdoor space to life.",
        "ar": "تجميل حدائق وزراعة في الكويت — تصميم الحدائق والمسطحات الخضراء وأنظمة الري والعناية بالنباتات لإحياء مساحتك الخارجية.",
        "ur": "کویت میں باغبانی اور پودے لگانا — باغ کا ڈیزائن، لان، آبپاشی اور پودوں کی دیکھ بھال جو آپ کی بیرونی جگہ کو خوبصورت بناتی ہے۔",
    },
    "house-cleaning": {
        "en": "Thorough house cleaning in Kuwait — regular, deep and post-construction cleaning by trained teams. A spotless home without the effort.",
        "ar": "تنظيف منازل شامل في الكويت — تنظيف دوري وعميق وما بعد التشطيب على يد فرق مدرّبة. منزل نظيف دون عناء.",
        "ur": "کویت میں مکمل گھر کی صفائی — تربیت یافتہ ٹیموں کی جانب سے باقاعدہ، گہری اور تعمیر کے بعد صفائی۔ بغیر محنت کے بے داغ گھر۔",
    },
    "heavy-equipment-rental": {
        "en": "Heavy equipment rental in Kuwait — forklifts, loaders and machinery with or without operators, available for short or long term.",
        "ar": "تأجير معدات ثقيلة في الكويت — رافعات شوكية ولوادر ومعدات مع أو بدون مشغّل، متاحة لفترات قصيرة أو طويلة.",
        "ur": "کویت میں بھاری مشینری کرایہ پر — فورک لفٹ، لوڈر اور مشینری آپریٹر کے ساتھ یا بغیر، مختصر یا طویل مدت کے لیے دستیاب۔",
    },
}

CLOSING = {
    "en": "Contact Tashtibat today for a fast, free quote — we serve all areas of Kuwait.",
    "ar": "تواصل مع تشطيبات الكويت اليوم للحصول على عرض سعر مجاني وسريع — نخدم جميع مناطق الكويت.",
    "ur": "آج ہی تشطیبات کویت سے رابطہ کریں مفت اور فوری تخمینہ کے لیے — ہم کویت کے تمام علاقوں میں خدمات فراہم کرتے ہیں۔",
}

SUFFIX = {"en": " in Kuwait", "ar": " في الكويت", "ur": " — کویت"}


class Command(BaseCommand):
    help = "Seed trilingual ServicePage rows for every service category."

    def handle(self, *args, **options):
        langs = ("ar", "en", "ur")
        created, updated = 0, 0

        for cat in ServiceCategory.objects.all():
            intros = INTRO.get(cat.slug)
            if not intros:
                self.stdout.write(self.style.WARNING(f"skip {cat.slug} (no copy)"))
                continue

            for lang in langs:
                name = cat.name_for(lang)
                intro = intros[lang]
                title = f"{name}{SUFFIX[lang]}" if SUFFIX[lang] not in name else name
                description = f"{intro}\n\n{CLOSING[lang]}"
                meta_desc = intro[:157].rsplit(" ", 1)[0] + "…" if len(intro) > 158 else intro

                obj, was_created = ServicePage.objects.update_or_create(
                    category=cat,
                    language=lang,
                    defaults={
                        "slug": cat.slug,  # reuse category slug; unique per (lang, slug)
                        "title": title,
                        "description": description,
                        "meta_description": meta_desc,
                        "is_active": True,
                    },
                )
                created += was_created
                updated += not was_created

        self.stdout.write(
            self.style.SUCCESS(f"Service pages: {created} created, {updated} updated.")
        )
