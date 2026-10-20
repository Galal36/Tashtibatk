"""
Management command: seed 3 linked articles (AR / EN / UR) in the
apartment-finishing category.  Safe to re-run — skips slugs that already exist.
"""
import uuid
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.articles.models import Article
from apps.services.models import ServiceCategory
from apps.accounts.models import User

# ---------------------------------------------------------------------------
# Shared translation_group so hreflang links the three together
# ---------------------------------------------------------------------------
TRANSLATION_GROUP = uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")

CATEGORY_SLUG = "apartment-finishing"


def get_author():
    return User.objects.filter(is_staff=True).first()


# ---------------------------------------------------------------------------
# Article content
# ---------------------------------------------------------------------------

AR_BODY = """
<h2>لماذا التخطيط هو سرّ نجاح تشطيب شقتك؟</h2>
<p>
تشطيب الشقة مشروع كبير يحتاج إلى رؤية واضحة من اليوم الأول.
سواء كنت تبحث عن تشطيب كامل من البداية للنهاية أو مجرد تجديد بسيط،
فإن <strong>تشطيباتك</strong> — منصة <strong>Tashtibatk</strong> المتخصصة —
تقدم لك الخبراء والحرفيين المؤهلين لتحويل شقتك الخام إلى بيت أحلامك.
</p>

<h2>خطوات التخطيط الصحيح</h2>
<ol>
  <li><strong>حدد ميزانيتك مسبقاً</strong> — ضع سقفاً واضحاً للإنفاق وراعِ 10% احتياطياً للطوارئ.</li>
  <li><strong>اختر أسلوب التشطيب</strong> — كلاسيك، مودرن، أو مينيماليست؟ الاختيار المبكر يوفر عليك التغييرات المكلفة.</li>
  <li><strong>ابدأ بالأعمال الخفية</strong> — السباكة والكهرباء والعزل قبل الديكور.</li>
  <li><strong>اختر مواد عالية الجودة</strong> — البورسلان والدهانات الفاخرة تعطيك عمراً أطول وصيانة أقل.</li>
  <li><strong>تابع العمل يومياً</strong> — الإشراف المباشر يمنع الأخطاء الباهظة.</li>
</ol>

<h2>ما الذي يميز Tashtibatk؟</h2>
<p>
مع <strong>Tashtibatk</strong> لا تقلق بشأن البحث عن حرفيين موثوقين؛
نحن نوفر لك فريقاً متكاملاً من النجارين والسباكين وفنيي الدهان والكهربائيين،
كلهم تحت سقف واحد وبإشراف محترف.
</p>

<blockquote>
  "البيت الجميل لا يُبنى بالصدفة، بل بالتخطيط الدقيق والتنفيذ الاحترافي."
</blockquote>

<h2>أبرز نصائح المحترفين</h2>
<ul>
  <li>لا تبخل في عزل الجدران والأسقف — يوفر التكييف ويحمي من الرطوبة.</li>
  <li>اختر بلاط بحجم 60×60 أو أكبر لإعطاء مساحة أوسع بصرياً.</li>
  <li>تأكد من توافق ألوان الديكور مع الإضاءة الطبيعية في شقتك.</li>
  <li>احتفظ بنسخة من مخطط الكهرباء والسباكة لأي إصلاح مستقبلي.</li>
</ul>

<h2>ابدأ رحلتك الآن</h2>
<p>
هل أنت مستعد لتحويل شقتك إلى مكان يعكس شخصيتك؟
تواصل مع فريق <strong>Tashtibatk</strong> اليوم واحصل على استشارة مجانية وعرض سعر مفصّل
لمشروعك — نحن هنا لنجعل حلمك حقيقة.
</p>
"""

EN_BODY = """
<h2>Why Planning Is the Secret to a Successful Apartment Finishing</h2>
<p>
Finishing an apartment is a major project that demands a clear vision from day one.
Whether you are looking for a full turnkey fit-out or a simple refresh,
<strong>Tashtibatk</strong> — your trusted finishing platform — connects you with
qualified craftsmen and professionals who turn your empty shell into the home of your dreams.
</p>

<h2>Step-by-Step Planning Guide</h2>
<ol>
  <li><strong>Set your budget early</strong> — define a firm ceiling and keep 10% in reserve for surprises.</li>
  <li><strong>Choose a design style</strong> — classic, modern, or minimalist? Deciding upfront avoids costly redesigns.</li>
  <li><strong>Start with hidden works</strong> — plumbing, electrical, and insulation come before any decoration.</li>
  <li><strong>Invest in quality materials</strong> — premium tiles and paints last longer and need less maintenance.</li>
  <li><strong>Supervise daily</strong> — active oversight prevents expensive mistakes from piling up.</li>
</ol>

<h2>What Makes Tashtibatk Different?</h2>
<p>
With <strong>Tashtibatk</strong> you never have to stress about finding reliable tradespeople.
We provide a complete team — carpenters, plumbers, painters, and electricians — all
under one roof, professionally managed from start to finish.
</p>

<blockquote>
  "A beautiful home is not built by chance — it is built by meticulous planning and expert execution."
</blockquote>

<h2>Pro Tips You Should Not Miss</h2>
<ul>
  <li>Never cut corners on wall and ceiling insulation — it reduces cooling costs and prevents moisture damage.</li>
  <li>Choose large-format tiles (60×60 cm or bigger) to make rooms feel more spacious.</li>
  <li>Align your colour palette with the natural light available in each room.</li>
  <li>Keep a copy of your electrical and plumbing plans for future repairs.</li>
</ul>

<h2>Start Your Journey Today</h2>
<p>
Ready to transform your apartment into a space that reflects your personality?
Contact the <strong>Tashtibatk</strong> team today for a free consultation and a
detailed quotation — we are here to make your vision a reality.
</p>
"""

UR_BODY = """
<h2>کامیاب تشطیب کا راز منصوبہ بندی میں ہے</h2>
<p>
اپارٹمنٹ کی تکمیل ایک بڑا منصوبہ ہے جس کے لیے پہلے دن سے واضح سوچ ضروری ہے۔
چاہے آپ مکمل ٹرن کی فٹ آؤٹ چاہتے ہوں یا صرف تھوڑی سی تبدیلی،
<strong>Tashtibatk</strong> — آپ کا قابلِ اعتماد تشطیب پلیٹ فارم —
ماہر کاریگروں اور پیشہ ور افراد سے آپ کو جوڑتا ہے جو آپ کے خالی فلیٹ کو
خوابوں کے گھر میں بدل دیتے ہیں۔
</p>

<h2>منصوبہ بندی کے اہم مراحل</h2>
<ol>
  <li><strong>پہلے بجٹ طے کریں</strong> — اخراجات کی حد مقرر کریں اور 10٪ ہنگامی رقم الگ رکھیں۔</li>
  <li><strong>ڈیزائن اسٹائل چنیں</strong> — کلاسک، ماڈرن یا مینیمالسٹ؟ ابتدائی فیصلہ مہنگی تبدیلیوں سے بچاتا ہے۔</li>
  <li><strong>پوشیدہ کاموں سے شروع کریں</strong> — سجاوٹ سے پہلے پلمبنگ، بجلی اور حرارتی موصلیت مکمل کریں۔</li>
  <li><strong>معیاری مواد میں سرمایہ کاری کریں</strong> — اعلیٰ ٹائلز اور پینٹ زیادہ عرصہ چلتے ہیں۔</li>
  <li><strong>روزانہ نگرانی کریں</strong> — ذاتی توجہ مہنگی غلطیوں کو روکتی ہے۔</li>
</ol>

<h2>Tashtibatk کو کیا منفرد بناتا ہے؟</h2>
<p>
<strong>Tashtibatk</strong> کے ساتھ آپ کو قابلِ اعتماد کاریگروں کی تلاش کی فکر نہیں کرنی۔
ہم آپ کو ایک مکمل ٹیم فراہم کرتے ہیں — بڑھئی، پلمبر، پینٹر اور الیکٹریشن —
سب ایک چھت کے نیچے، شروع سے آخر تک پیشہ ورانہ نگرانی کے ساتھ۔
</p>

<blockquote>
  "خوبصورت گھر اتفاق سے نہیں بنتا — یہ دقیق منصوبہ بندی اور ماہرانہ عمل سے بنتا ہے۔"
</blockquote>

<h2>ماہرین کی اہم ترین نصیحتیں</h2>
<ul>
  <li>دیواروں اور چھتوں کی موصلیت میں کنجوسی نہ کریں — بجلی کا بل کم کرتی ہے اور نمی سے بچاتی ہے۔</li>
  <li>بڑے سائز کی ٹائلز (60×60 سینٹی میٹر یا بڑی) کمرے کو وسیع دکھاتی ہیں۔</li>
  <li>رنگوں کا انتخاب کمرے میں آنے والی قدرتی روشنی کے مطابق کریں۔</li>
  <li>بجلی اور پلمبنگ کے نقشے مستقبل کی مرمت کے لیے محفوظ رکھیں۔</li>
</ul>

<h2>آج ہی شروع کریں</h2>
<p>
کیا آپ اپنے اپارٹمنٹ کو اپنی شخصیت کا عکس بنانے کے لیے تیار ہیں؟
آج ہی <strong>Tashtibatk</strong> کی ٹیم سے رابطہ کریں اور مفت مشاورت اور
تفصیلی قیمت کا تخمینہ حاصل کریں — ہم آپ کے خواب کو حقیقت بنانے کے لیے حاضر ہیں۔
</p>
"""

ARTICLES = [
    {
        "language": "ar",
        "title": "كيف تخطط لتشطيب شقتك بنجاح؟",
        "slug": "khutuwat-tashteeb-shaqqa-najih",
        "meta_title": "تخطيط تشطيب الشقة | Tashtibatk",
        "meta_description": (
            "دليل عملي من Tashtibatk لتخطيط تشطيب شقتك خطوة بخطوة، "
            "من الميزانية إلى التسليم النهائي."
        ),
        "body": AR_BODY,
    },
    {
        "language": "en",
        "title": "How to Plan Your Apartment Finishing Successfully",
        "slug": "how-to-plan-apartment-finishing",
        "meta_title": "Apartment Finishing Planning Guide | Tashtibatk",
        "meta_description": (
            "A practical step-by-step guide from Tashtibatk on planning your "
            "apartment finishing — from setting a budget to final handover."
        ),
        "body": EN_BODY,
    },
    {
        "language": "ur",
        "title": "اپارٹمنٹ کی کامیاب تکمیل کے لیے منصوبہ بندی",
        "slug": "apartment-finishing-planning-ur",
        "meta_title": "اپارٹمنٹ تکمیل گائیڈ | Tashtibatk",
        "meta_description": (
            "Tashtibatk کی طرف سے اپارٹمنٹ کی تکمیل کی منصوبہ بندی کا "
            "عملی مرحلہ وار رہنما — بجٹ سے حتمی تحویل تک۔"
        ),
        "body": UR_BODY,
    },
]


class Command(BaseCommand):
    help = "Seed 3 linked articles (AR / EN / UR) in the apartment-finishing category."

    def handle(self, *args, **options):
        try:
            category = ServiceCategory.objects.get(slug=CATEGORY_SLUG)
        except ServiceCategory.DoesNotExist:
            self.stderr.write(f"Category '{CATEGORY_SLUG}' not found.")
            return

        author = get_author()
        now = timezone.now()
        created_count = 0

        for data in ARTICLES:
            slug = data["slug"]
            lang = data["language"]

            if Article.objects.filter(language=lang, slug=slug).exists():
                self.stdout.write(f"  skip [{lang}] {slug} — already exists")
                continue

            article = Article(
                translation_group=TRANSLATION_GROUP,
                category=category,
                author=author,
                language=lang,
                status=Article.PUBLISHED,
                published_at=now,
                title=data["title"],
                slug=slug,
                body=data["body"],
                meta_title=data["meta_title"],
                meta_description=data["meta_description"],
            )
            article.save()
            created_count += 1
            self.stdout.write(self.style.SUCCESS(f"  created [{lang}] {article.title}"))

        self.stdout.write(self.style.SUCCESS(f"\nDone — {created_count} article(s) created."))
