"""
Seed 5 Urdu plumbing articles — Urdu counterparts of the existing Arabic set.
Shares translation_group UUIDs with the AR versions so hreflang links them.
Safe to re-run — skips slugs that already exist.
"""
import uuid
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.articles.models import Article
from apps.services.models import ServiceCategory
from apps.accounts.models import User

CATEGORY_SLUG = "plumbing"


def staff_user():
    return User.objects.filter(is_staff=True).first()


ARTICLES = [
    # ------------------------------------------------------------------ 1
    # AR twin: alamat-tasarrub-miyah-fi-manzil
    {
        "slug": "ghar-mein-pani-ka-rissao-kaise-pakren",
        "translation_group": uuid.UUID("76f4986f-a16c-4408-b8c5-481bc5845e32"),
        "title": "گھر میں پانی کا رساؤ — جلد پہچانیں اور نقصان سے بچیں",
        "meta_title": "پانی کا رساؤ پہچانیں | Tashtibatk",
        "meta_description": (
            "Tashtibatk کے ساتھ جانیں کہ گھر میں چھپے پانی کے رساؤ کی علامات "
            "کیا ہیں اور انہیں بڑھنے سے پہلے کیسے روکا جائے۔"
        ),
        "body": """
<h2>پانی کا رساؤ — چھوٹا مسئلہ، بڑا نقصان</h2>
<p>
پانی کا ایک چھوٹا سا رساؤ اگر نظرانداز کیا جائے تو دیواریں گلنے لگتی ہیں،
سیلن پھیلتی ہے اور پانی کا بل اچانک بڑھ جاتا ہے۔
<strong>Tashtibatk</strong> کی ماہر ٹیم آپ کے گھر میں آ کر رساؤ کا درست مقام
بغیر توڑ پھوڑ کے معلوم کرتی ہے اور فوری حل فراہم کرتی ہے۔
</p>

<h2>رساؤ کی اہم علامات جو نظرانداز نہ کریں</h2>
<ul>
  <li><strong>پانی کا بل اچانک بڑھ جانا</strong> — بغیر کسی خاص وجہ کے۔</li>
  <li><strong>دیواروں یا چھت پر دھبے یا رنگ کا تبدیل ہونا</strong> — خاص طور پر پائپوں کے قریب۔</li>
  <li><strong>خاموشی میں پانی گرنے کی آواز</strong> — دیواروں یا چھت کے اندر سے۔</li>
  <li><strong>نلکوں میں پانی کا دباؤ اچانک کم ہو جانا۔</strong></li>
  <li><strong>باتھ روم یا باورچی خانے میں بند جگہ جیسی بو۔</strong></li>
  <li><strong>دیوار یا چھت کی پلستر کا پھولنا یا اکھڑنا۔</strong></li>
</ul>

<h2>خود گھر میں رساؤ کی جانچ کیسے کریں؟</h2>
<ol>
  <li>تمام نلکے اور پانی استعمال کرنے والے آلات بند کریں۔</li>
  <li>پانی کے میٹر کی ریڈنگ نوٹ کریں اور دو گھنٹے انتظار کریں۔</li>
  <li>اگر ریڈنگ بدل گئی تو گھر میں چھپا رساؤ موجود ہے۔</li>
</ol>

<blockquote>
  "آج کا چھوٹا رساؤ کل کا بڑا خرچہ بن سکتا ہے — فوری قدم اٹھائیں۔"
</blockquote>

<h2>رساؤ پکڑیں تو کیا کریں؟</h2>
<p>
فوراً مرکزی پانی کی ٹونٹی بند کریں اور <strong>Tashtibatk</strong> سے رابطہ کریں۔
ہماری ٹیم جدید آلات کے ذریعے رساؤ کی جگہ معلوم کرتی ہے اور مستقل مرمت کرتی ہے۔
<strong>Tashtibatk</strong> سے ابھی رابطہ کریں — وقت اور پیسہ دونوں بچائیں۔
</p>
""",
    },
    # ------------------------------------------------------------------ 2
    # AR twin: asbab-insidad-mawaseer-wa-wiqaya
    {
        "slug": "pipes-band-hone-ki-wajuhat-aur-bachao",
        "translation_group": uuid.UUID("fd9eecaf-f4d4-470a-97f3-d00a3a8e93f6"),
        "title": "پائپ بند کیوں ہوتے ہیں؟ وجوہات اور بہترین احتیاطی تدابیر",
        "meta_title": "پائپ بند ہونے کی وجوہات | Tashtibatk",
        "meta_description": (
            "Tashtibatk کے ساتھ جانیں کہ گھر کے پائپ بار بار کیوں بند ہوتے ہیں "
            "اور انہیں صاف اور چالو رکھنے کے آسان طریقے کیا ہیں۔"
        ),
        "body": """
<h2>پائپ بند ہونا — کویت کے گھروں کا سب سے عام مسئلہ</h2>
<p>
نکاسی کے پائپ کا بند ہونا ہر گھر میں آتا ہے، لیکن اگر بار بار ہو تو اس کی گہری وجہ ہے۔
<strong>Tashtibatk</strong> کے ماہر آپ کو بتاتے ہیں کہ مسئلہ کہاں سے شروع ہوتا ہے
اور اسے کیسے روکا جا سکتا ہے۔
</p>

<h2>پائپ بند ہونے کی سب سے عام وجوہات</h2>
<ul>
  <li><strong>چکنائی اور تیل</strong> — ٹھنڈا ہو کر پائپ کے اندر جم جاتے ہیں اور راستہ تنگ کرتے ہیں۔</li>
  <li><strong>بال اور صابن</strong> — باتھ روم میں جمع ہو کر بڑی رکاوٹ بنتے ہیں۔</li>
  <li><strong>کھانے کی باقیات اور چائے کی پتی</strong> — باریک ذرات جمع ہو کر بلاک بناتے ہیں۔</li>
  <li><strong>بہت زیادہ ٹشو پیپر</strong> — خاص طور پر چھوٹے قطر کے پائپوں میں۔</li>
  <li><strong>چونے اور کیلشیم کا جمنا</strong> — سخت پانی سے پائپ کی اندرونی دیوار تنگ ہو جاتی ہے۔</li>
  <li><strong>درختوں کی جڑیں</strong> — باہر کے پائپوں میں گھس آتی ہیں۔</li>
</ul>

<h2>بندش سے بچنے کے عملی طریقے</h2>
<ol>
  <li>نالیوں پر باریک جالی لگائیں تاکہ بال اور کچرا اندر نہ جائے۔</li>
  <li>تیل اور چکنائی بند ڈبوں میں ڈالیں، نالی میں نہیں۔</li>
  <li>ہر ہفتے ابلتا پانی اور سرکہ ڈالیں — قدرتی صفائی۔</li>
  <li>ہر چھ ماہ میں <strong>Tashtibatk</strong> سے ہائی پریشر کلیننگ کروائیں۔</li>
</ol>

<blockquote>
  "بندش روکنا اسے کھولنے سے کہیں سستا ہے۔"
</blockquote>

<h2>بندش ٹھیک نہ ہو تو؟</h2>
<p>
اگر گھریلو طریقوں سے بندش نہ کھلے تو <strong>Tashtibatk</strong> کو کال کریں۔
ہمارے پاس ہائی پریشر جیٹ اور پائپ کیمرہ ہے جو بندش کی جگہ معلوم کر کے
اسے ایک ہی وزٹ میں مکمل صاف کر دیتا ہے۔
</p>
""",
    },
    # ------------------------------------------------------------------ 3
    # AR twin: ikhtiyar-afdal-sharika-sibaka
    {
        "slug": "behtar-plumbing-company-ka-intikhab-kaise-karen",
        "translation_group": uuid.UUID("55a2b704-ec05-46aa-95a4-6c6fa3599f3e"),
        "title": "کویت میں بہترین پلمبنگ کمپنی کا انتخاب کیسے کریں؟",
        "meta_title": "بہترین پلمبنگ کمپنی | Tashtibatk",
        "meta_description": (
            "Tashtibatk کی طرف سے 5 اہم معیار جو آپ کو کویت میں قابل اعتماد "
            "پلمبنگ کمپنی چننے میں مدد دیں گے — اچھا کام، منصفانہ قیمت۔"
        ),
        "body": """
<h2>پلمبر کا انتخاب — ایک اہم فیصلہ</h2>
<p>
غیر تجربہ کار پلمبر ایک چھوٹا مسئلہ حل کر کے دو نئے پیدا کر دیتا ہے۔
صحیح کمپنی کا انتخاب آپ کا پیسہ بچاتا ہے اور گھر کو پانی کے نقصان سے محفوظ رکھتا ہے۔
<strong>Tashtibatk</strong> کے صارفین جو معیار دیکھتے ہیں وہ یہاں ہیں۔
</p>

<h2>5 معیار جن پر سمجھوتہ نہ کریں</h2>
<ol>
  <li>
    <strong>تجربہ اور مہارت</strong> — کتنے سال کا تجربہ ہے؟ کس قسم کے کام کیے؟
    گھریلو پلمبنگ کا ماہر عام ٹھیکیدار سے مختلف ہوتا ہے۔
  </li>
  <li>
    <strong>لائسنس اور انشورنس</strong> — لائسنس یافتہ کمپنی کام کے دوران کسی نقصان کی ذمہ دار ہوتی ہے۔
  </li>
  <li>
    <strong>قیمت میں شفافیت</strong> — کام شروع ہونے سے پہلے تحریری اندازہ لیں۔
  </li>
  <li>
    <strong>وقت کی پابندی</strong> — کیا وہ وقت پر آتے ہیں؟ کیا فون اٹھاتے ہیں؟
  </li>
  <li>
    <strong>کام کی ضمانت</strong> — اچھی کمپنی اپنے کام پر ضمانت دیتی ہے۔
  </li>
</ol>

<blockquote>
  "سستا پلمبر مہنگا پڑ سکتا ہے — معیار کو ترجیح دیں۔"
</blockquote>

<h2>معاہدے سے پہلے یہ سوالات ضرور پوچھیں</h2>
<ul>
  <li>کیا مرمت پر ضمانت ملے گی؟</li>
  <li>قیمت کا حساب گھنٹے سے ہے یا کام سے؟</li>
  <li>کیا کام ختم ہونے کے بعد جگہ صاف چھوڑیں گے؟</li>
  <li>کیا اس قسم کے عیب کا آپ کو تجربہ ہے؟</li>
</ul>

<h2>Tashtibatk کیوں بہتر ہے؟</h2>
<p>
<strong>Tashtibatk</strong> میں تجربہ کار پلمبر، واضح قیمتیں، کام کی ضمانت
اور وقت کی پابندی — سب ایک چھت کے نیچے۔
<strong>Tashtibatk</strong> سے ابھی مفت مشاورت لیں اور اپنے گھر کی پلمبنگ کا
مفصل اندازہ حاصل کریں۔
</p>
""",
    },
    # ------------------------------------------------------------------ 4
    # AR twin: siyaanat-sakhhan-manzili-dalil-shamil
    {
        "slug": "ghar-ka-geyser-service-aur-dekh-bhal",
        "translation_group": uuid.UUID("a748c4dc-4fab-47f6-ad51-7a27adc33620"),
        "title": "گھر کا گیزر — مکمل سروس گائیڈ اور خرابی کی علامات",
        "meta_title": "گیزر کی دیکھ بھال | Tashtibatk",
        "meta_description": (
            "Tashtibatk کا گیزر کیئر گائیڈ: خرابی کی علامات، باقاعدہ سروس کے "
            "مراحل اور یہ کب ماہر کو بلانے کا وقت ہے۔"
        ),
        "body": """
<h2>گیزر — خاموش کام کرتا ہے جب تک بند نہ ہو جائے</h2>
<p>
گھر کا گیزر روزانہ بغیر شکایت کام کرتا ہے — جب تک اچانک بند نہ ہو جائے۔
باقاعدہ سروس بجلی کا بل کم کرتی ہے، عمر بڑھاتی ہے اور اچانک خرابی سے بچاتی ہے۔
<strong>Tashtibatk</strong> گھروں اور فلیٹوں میں گیزر کی مکمل سروس فراہم کرتی ہے۔
</p>

<h2>فوری توجہ کی ضرورت والی علامات</h2>
<ul>
  <li><strong>پانی گرم نہ ہونا</strong> — باوجود زیادہ درجہ حرارت سیٹ کرنے کے۔</li>
  <li><strong>گرم ہوتے وقت کٹ کٹ کی آواز</strong> — کیلشیم کے جمنے کی علامت۔</li>
  <li><strong>ٹینک کے نیچے یا جوڑوں سے پانی رسنا۔</strong></li>
  <li><strong>نلکے سے زنگ آلود پانی آنا۔</strong></li>
  <li><strong>گرم پانی میں کچے انڈے جیسی بو۔</strong></li>
</ul>

<h2>باقاعدہ سروس کے مراحل</h2>
<ol>
  <li><strong>سالانہ ٹینک خالی کرنا</strong> — تہہ میں جمی گندگی باہر نکالنا۔</li>
  <li><strong>میگنیشیم اینوڈ کی جانچ</strong> — یہ حصہ ٹینک کو زنگ سے بچاتا ہے، ہر دو سال بعد بدلیں۔</li>
  <li><strong>سیفٹی والو کی جانچ</strong> — زیادہ دباؤ پر کھلنا چاہیے، نہ کھلے تو فوری بدلیں۔</li>
  <li><strong>ہیٹنگ ایلیمنٹ کی صفائی</strong> — خاص طور پر سخت پانی والے علاقوں میں ضروری۔</li>
  <li><strong>پائپوں کی حرارتی موصلیت کی جانچ</strong> — بجلی بچانے کے لیے اہم۔</li>
</ol>

<blockquote>
  "سال میں ایک بار سروس کرائیں — گیزر دوگنا عرصہ چلے گا۔"
</blockquote>

<h2>ماہر کو کب بلائیں؟</h2>
<p>
اگر اوپر دی گئی کوئی بھی علامت نظر آئے یا گیزر کو آٹھ سال سے زیادہ ہو گئے ہوں،
<strong>Tashtibatk</strong> سے سروس وزٹ بک کریں۔
ہماری ٹیم مکمل معائنہ کر کے رپورٹ اور اندازہ دیتی ہے — سب ایک وزٹ میں۔
</p>
""",
    },
    # ------------------------------------------------------------------ 5
    # AR twin: aataal-sibaka-shaeia-wa-isilahiha
    {
        "slug": "plumbing-ke-aam-masail-aur-hal",
        "translation_group": uuid.UUID("ef7954b5-6fb6-48c6-aec8-f6826d0af941"),
        "title": "گھر کی پلمبنگ کے عام مسائل اور ان کا حل",
        "meta_title": "پلمبنگ کے عام مسائل | Tashtibatk",
        "meta_description": (
            "Tashtibatk کے ساتھ جانیں گھر کی پلمبنگ کے 5 سب سے عام مسائل، "
            "آپ خود کیا ٹھیک کر سکتے ہیں اور کب ماہر کو بلانا ضروری ہے۔"
        ),
        "body": """
<h2>پلمبنگ کے مسائل — ہر گھر میں آتے ہیں</h2>
<p>
کوئی بھی گھر پلمبنگ کے مسائل سے مکمل محفوظ نہیں۔
کچھ مسائل آپ خود حل کر سکتے ہیں، کچھ کے لیے <strong>Tashtibatk</strong> کے ماہر کی ضرورت ہے
— تاکہ چھوٹا مسئلہ بڑا نقصان نہ بنے۔
</p>

<h2>5 سب سے عام مسائل اور ان کا حل</h2>

<h3>۱. نلکے سے مسلسل پانی ٹپکنا</h3>
<p>
اکثر اندرونی ربڑ واشر گھس جاتا ہے۔ سادہ نلکوں میں آپ خود بدل سکتے ہیں۔
جدید مکسر ٹیپ کے لیے <strong>Tashtibatk</strong> کے فنی کو بلائیں تاکہ مکسر خراب نہ ہو۔
</p>

<h3>۲. فلش کے بعد ٹوائلٹ میں پانی بہتا رہنا</h3>
<p>
عام طور پر فلوٹ والو یا فلیپر خراب ہوتا ہے۔
فلش کے بعد بھی پانی کی آواز آئے تو یہ حصے بدلنے کا وقت ہے۔
</p>

<h3>۳. شاور میں پانی کا دباؤ کم ہونا</h3>
<p>
شاور ہیڈ میں کیلشیم جم جاتا ہے — اسے سرکے میں چند گھنٹے بھگو دیں۔
اگر پھر بھی ٹھیک نہ ہو تو مرکزی پائپ میں مسئلہ ہو سکتا ہے۔
</p>

<h3>۴. نالی سے بدبو آنا</h3>
<p>
ابلتا پانی پھر بیکنگ سوڈا اور سرکہ ڈالیں۔
بدبو جاری رہے تو جزوی بندش ہو سکتی ہے — پریشر کلیننگ ضروری ہے۔
</p>

<h3>۵. سنک کے نیچے سے پانی رسنا</h3>
<p>
پہلے جوڑوں کو ہاتھ سے سخت کریں۔
اگر پائپ کے جسم سے رس رہا ہو تو فوری بدلیں — الماری کو نقصان سے بچائیں۔
</p>

<blockquote>
  "ہر چھوٹا مسئلہ جو آج ٹالیں وہ کل دوگنا خرچہ بن کر آتا ہے۔"
</blockquote>

<h2>Tashtibatk کب بلائیں؟</h2>
<ul>
  <li>کوئی بھی رساؤ جس کا ذریعہ نامعلوم ہو۔</li>
  <li>ایک ساتھ کئی نلکوں میں پانی بند ہو جائے۔</li>
  <li>دیوار یا چھت پر نمی ظاہر ہو۔</li>
  <li>دیوار کے اندر یا چھپے پائپ کا کوئی مسئلہ ہو۔</li>
</ul>
<p>
<strong>Tashtibatk</strong> گھر کی ہر قسم کی پلمبنگ سنبھالتی ہے —
ماہر فنی، پیشہ ور آلات۔ ابھی بک کریں اور مفت تشخیص پائیں۔
</p>
""",
    },
]


class Command(BaseCommand):
    help = "Seed 5 Urdu plumbing articles linked to their Arabic twins."

    def handle(self, *args, **options):
        try:
            category = ServiceCategory.objects.get(slug=CATEGORY_SLUG)
        except ServiceCategory.DoesNotExist:
            self.stderr.write(f"Category '{CATEGORY_SLUG}' not found.")
            return

        author = staff_user()
        now = timezone.now()
        created = 0

        for data in ARTICLES:
            if Article.objects.filter(language="ur", slug=data["slug"]).exists():
                self.stdout.write(f"  skip  {data['slug']}")
                continue

            article = Article(
                translation_group=data["translation_group"],
                category=category,
                author=author,
                language="ur",
                status=Article.PUBLISHED,
                published_at=now,
                title=data["title"],
                slug=data["slug"],
                body=data["body"],
                meta_title=data["meta_title"],
                meta_description=data["meta_description"],
            )
            article.save()
            created += 1
            self.stdout.write(self.style.SUCCESS(f"  created  {article.title}"))

        self.stdout.write(self.style.SUCCESS(f"\nDone — {created} article(s) created."))
