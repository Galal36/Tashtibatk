"""
Import the owner's topic list into the Topic queue (idempotent: existing
titles are left untouched, so admin edits survive re-imports).

File format: section lines "N. <name>" at column 0, topic lines indented
"    N. <title>". Sections are mapped to site categories below; anything not
mapped goes to the hidden "others" category.

Priorities are assigned round-robin across sections (in SECTION_ORDER) so the
queue alternates services instead of writing 10 plumbing articles in a row.
"""
import re
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.content_api.models import Topic
from apps.services.models import ServiceCategory

DEFAULT_FILE = Path(settings.BASE_DIR).parent / "automation_topics" / "topics_suggested.txt"

# section number in the file -> category slug
SECTION_CATEGORY = {
    1: "apartment-finishing",   # تشطيب الشقق والبيوت
    2: "others",                # البناء وبناء القسائم
    3: "apartment-finishing",   # الصبغ والدهانات
    4: "apartment-finishing",   # الجبس بورد والأسقف
    5: "apartment-finishing",   # الأرضيات
    6: "plumbing",              # السباكة
    7: "others",                # الكهرباء والإنارة
    8: "carpentry",             # النجارة
    9: "apartment-finishing",   # المطابخ
    10: "apartment-finishing",  # المحارة (اللياسة)
    11: "others",               # العزل
    12: "others",               # التكييف
    13: "apartment-finishing",  # تجديد الحمامات
    14: "furniture-moving",     # نقل العفش
    15: "landscaping",          # تنسيق الحدائق
    16: "others",               # المظلات والسواتر
    17: "others",               # الألمنيوم والزجاج
    18: "apartment-finishing",  # الديكور الداخلي
    19: "others",              # الترميم والصيانة
    20: "apartment-finishing",  # التعاقد والتكاليف
}
# Services the site actually sells come first in the rotation.
SECTION_ORDER = [6, 1, 14, 8, 13, 3, 15, 5, 4, 9, 20, 10, 18, 2, 12, 11, 7, 17, 16, 19]

OTHERS = {
    "slug": "others",
    "name_ar": "خدمات أخرى",
    "name_en": "Other Services",
    "name_ur": "دیگر خدمات",
    "display_order": 99,
    # Hidden from the public services lists: it has no service page.
    "is_active": False,
}

SECTION_RE = re.compile(r"^(\d+)\.\s*(.+?)\s*$")
TOPIC_RE = re.compile(r"^\s+(\d+)\.\s*(.+?)\s*$")


def parse(text):
    sections, current = {}, None
    for line in text.splitlines():
        if not line.strip():
            continue
        m = TOPIC_RE.match(line)
        if m and current is not None:
            sections[current].append(m.group(2))
            continue
        m = SECTION_RE.match(line)
        if m:
            current = int(m.group(1))
            sections[current] = []
    return sections


class Command(BaseCommand):
    help = "Import topics_suggested.txt into the content Topic queue."

    def add_arguments(self, parser):
        parser.add_argument("--file", default=str(DEFAULT_FILE))
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **opts):
        path = Path(opts["file"])
        if not path.exists():
            raise CommandError(f"File not found: {path}")
        sections = parse(path.read_text(encoding="utf-8"))
        if not sections:
            raise CommandError("No sections parsed — check the file format.")

        order = SECTION_ORDER + sorted(set(sections) - set(SECTION_ORDER))
        queue, depth = [], max(len(v) for v in sections.values())
        for i in range(depth):
            for sec in order:
                items = sections.get(sec, [])
                if i < len(items):
                    queue.append((sec, items[i]))

        with transaction.atomic():
            others, made = ServiceCategory.objects.get_or_create(
                slug=OTHERS["slug"], defaults={k: v for k, v in OTHERS.items() if k != "slug"}
            )
            if made:
                self.stdout.write("Created hidden category 'others'.")
            cats = {c.slug: c for c in ServiceCategory.objects.all()}

            created = 0
            for rank, (sec, title) in enumerate(queue):
                category = cats.get(SECTION_CATEGORY.get(sec, "others"), others)
                _, was_created = Topic.objects.get_or_create(
                    title=title,
                    defaults={"category": category, "priority": len(queue) - rank},
                )
                created += was_created

            self.stdout.write(self.style.SUCCESS(
                f"Parsed {len(queue)} topics in {len(sections)} sections; created {created} new."
            ))
            if opts["dry_run"]:
                transaction.set_rollback(True)
                self.stdout.write("Dry run — rolled back.")
