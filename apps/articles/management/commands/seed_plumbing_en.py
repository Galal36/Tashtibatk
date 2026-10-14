"""
Seed 5 English plumbing articles — English counterparts of the AR/UR set.
Shares translation_group UUIDs so hreflang links all three languages together.
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
    # UR twin: ghar-mein-pani-ka-rissao-kaise-pakren
    {
        "slug": "signs-of-water-leaks-at-home",
        "translation_group": uuid.UUID("76f4986f-a16c-4408-b8c5-481bc5845e32"),
        "title": "Water Leaks at Home: How to Spot Them Before They Cause Damage",
        "meta_title": "Signs of Water Leaks at Home | Tashtibatk",
        "meta_description": (
            "Learn the hidden signs of water leaks in your home and how Tashtibatk "
            "helps you detect and fix them fast before costs multiply."
        ),
        "body": """
<h2>Why Early Detection Saves You Money</h2>
<p>
A small water leak looks harmless at first — until it quietly rots your walls,
breeds mould, and sends your water bill through the roof.
<strong>Tashtibatk</strong> specialises in locating hidden leaks without destructive
drilling, then fixing them permanently in a single visit.
</p>

<h2>Warning Signs You Should Never Ignore</h2>
<ul>
  <li><strong>A sudden spike in your water bill</strong> with no change in daily usage.</li>
  <li><strong>Damp spots or discolouration on walls</strong>, especially near pipe runs.</li>
  <li><strong>The sound of dripping</strong> inside walls or ceilings when everything is off.</li>
  <li><strong>Unexplained drop in water pressure</strong> at taps or showers.</li>
  <li><strong>A musty smell</strong> in bathrooms or the kitchen with no visible cause.</li>
  <li><strong>Paint bubbling or plaster flaking</strong> on walls and ceilings.</li>
</ul>

<h2>A Simple DIY Leak Check</h2>
<ol>
  <li>Turn off every tap and water-using appliance in the house.</li>
  <li>Note the reading on your water meter.</li>
  <li>Wait two hours without using any water, then check the meter again.</li>
  <li>If the reading has changed, you have a hidden leak somewhere in the system.</li>
</ol>

<blockquote>
  "A leak ignored today costs ten times more to fix tomorrow."
</blockquote>

<h2>What to Do When You Find a Leak</h2>
<p>
Shut off the main water supply immediately, then call <strong>Tashtibatk</strong>.
Our team arrives with the latest detection equipment — no guesswork, no unnecessary
breaking of tiles or walls. We pinpoint the source, fix it properly, and leave your
home clean. Contact <strong>Tashtibatk</strong> now and stop the damage before it spreads.
</p>
""",
    },
    # ------------------------------------------------------------------ 2
    # AR twin: asbab-insidad-mawaseer-wa-wiqaya
    # UR twin: pipes-band-hone-ki-wajuhat-aur-bachao
    {
        "slug": "why-pipes-get-blocked-and-how-to-prevent-it",
        "translation_group": uuid.UUID("fd9eecaf-f4d4-470a-97f3-d00a3a8e93f6"),
        "title": "Why Pipes Get Blocked and How to Prevent It",
        "meta_title": "Blocked Pipes: Causes & Prevention | Tashtibatk",
        "meta_description": (
            "Tashtibatk explains the most common reasons drain pipes block up in "
            "Kuwait homes and gives you practical tips to keep them flowing freely."
        ),
        "body": """
<h2>Blocked Drains — More Common Than You Think</h2>
<p>
Drain blockages are among the most frequent plumbing complaints in Kuwait homes.
They build up quietly over time until water stops draining entirely.
<strong>Tashtibatk</strong> walks you through the root causes and the best habits
to keep your pipes clear year-round.
</p>

<h2>The Most Common Causes of Pipe Blockages</h2>
<ul>
  <li><strong>Grease and cooking oil</strong> — they solidify inside the pipe as they cool, slowly narrowing the passage.</li>
  <li><strong>Hair and soap residue</strong> — they combine in bathroom drains and form stubborn clumps.</li>
  <li><strong>Food scraps and coffee grounds</strong> — fine particles slip past even a sink strainer and accumulate.</li>
  <li><strong>Excess toilet paper</strong> — especially in pipes with a small diameter.</li>
  <li><strong>Calcium and limescale build-up</strong> — hard water gradually coats the inside of pipes, reducing flow.</li>
  <li><strong>Tree roots</strong> — they crack and infiltrate outdoor or garden pipes over time.</li>
</ul>

<h2>Simple Habits That Prevent Blockages</h2>
<ol>
  <li>Fit a fine mesh strainer over every drain to catch hair and debris.</li>
  <li>Never pour grease or cooking oil down the sink — bin it in a sealed container.</li>
  <li>Pour a cup of boiling water followed by baking soda and vinegar down drains weekly.</li>
  <li>Book a professional high-pressure clean with <strong>Tashtibatk</strong> every six months.</li>
</ol>

<blockquote>
  "Preventing a blockage costs a fraction of clearing one."
</blockquote>

<h2>When Home Remedies Are Not Enough</h2>
<p>
If your drain is still blocked after trying the steps above, it is time to call
<strong>Tashtibatk</strong>. We use high-pressure water jetting and pipe inspection
cameras to find the exact location of the blockage and clear it completely — in one visit.
</p>
""",
    },
    # ------------------------------------------------------------------ 3
    # AR twin: ikhtiyar-afdal-sharika-sibaka
    # UR twin: behtar-plumbing-company-ka-intikhab-kaise-karen
    {
        "slug": "how-to-choose-a-reliable-plumbing-company-in-kuwait",
        "translation_group": uuid.UUID("55a2b704-ec05-46aa-95a4-6c6fa3599f3e"),
        "title": "How to Choose a Reliable Plumbing Company in Kuwait",
        "meta_title": "Choose a Reliable Plumber in Kuwait | Tashtibatk",
        "meta_description": (
            "5 professional criteria from Tashtibatk to help you pick the right "
            "plumbing company in Kuwait — quality work at a fair, transparent price."
        ),
        "body": """
<h2>Why Choosing the Right Plumber Matters</h2>
<p>
An unqualified plumber often fixes one problem and creates two more.
Choosing a reputable company protects your home from repeated water damage and
saves you money in the long run. Here are the criteria that <strong>Tashtibatk</strong>
customers rely on when evaluating any service provider.
</p>

<h2>5 Criteria You Should Not Compromise On</h2>
<ol>
  <li>
    <strong>Experience and specialisation</strong> — How many years have they been operating?
    What types of jobs have they completed? A residential plumbing specialist is very
    different from a general contractor.
  </li>
  <li>
    <strong>Licence and insurance</strong> — A licensed company is legally accountable for
    any damage caused during the job.
  </li>
  <li>
    <strong>Transparent pricing</strong> — Always get a written quote before work begins.
    No surprises, no hidden fees.
  </li>
  <li>
    <strong>Punctuality and communication</strong> — Do they show up on time? Do they answer
    calls promptly? Reliability is everything in an emergency.
  </li>
  <li>
    <strong>Guarantee on workmanship</strong> — A company confident in its work stands behind
    it with a warranty.
  </li>
</ol>

<blockquote>
  "The cheapest quote is rarely the best value — quality pays for itself over time."
</blockquote>

<h2>Questions to Ask Before You Sign Anything</h2>
<ul>
  <li>Do you offer a warranty on repairs?</li>
  <li>Is pricing per hour or per job?</li>
  <li>Have you handled this specific type of fault before?</li>
  <li>Will you leave the work area clean when you're done?</li>
</ul>

<h2>Why Customers Trust Tashtibatk</h2>
<p>
<strong>Tashtibatk</strong> brings together every one of those criteria under one roof:
certified plumbers, upfront pricing, workmanship guarantees, and strict punctuality.
Reach out to <strong>Tashtibatk</strong> today for a free consultation and a detailed
quote for any plumbing work in your home.
</p>
""",
    },
    # ------------------------------------------------------------------ 4
    # AR twin: siyaanat-sakhhan-manzili-dalil-shamil
    # UR twin: ghar-ka-geyser-service-aur-dekh-bhal
    {
        "slug": "water-heater-maintenance-complete-guide",
        "translation_group": uuid.UUID("a748c4dc-4fab-47f6-ad51-7a27adc33620"),
        "title": "Water Heater Maintenance: A Complete Guide to Extending Its Life",
        "meta_title": "Water Heater Maintenance Guide | Tashtibatk",
        "meta_description": (
            "Tashtibatk's complete guide to home water heater maintenance — warning "
            "signs, step-by-step servicing, and when to call a professional."
        ),
        "body": """
<h2>Your Water Heater Works in Silence — Until It Stops</h2>
<p>
Your water heater quietly does its job every single day — until the morning it
fails and you are left with a cold shower. Regular maintenance extends its lifespan,
lowers your electricity bill, and prevents sudden breakdowns at the worst possible moment.
<strong>Tashtibatk</strong> provides comprehensive water heater servicing for homes
and apartments across Kuwait.
</p>

<h2>Warning Signs That Need Immediate Attention</h2>
<ul>
  <li><strong>Lukewarm or cold water</strong> despite setting the heater to a high temperature.</li>
  <li><strong>Popping or rumbling sounds</strong> during heating — a sign of sediment build-up.</li>
  <li><strong>Water leaking</strong> from the base of the tank or from pipe connections.</li>
  <li><strong>Rusty or discoloured hot water</strong> — indicates corrosion inside the tank.</li>
  <li><strong>A sulphur-like smell</strong> from the hot tap.</li>
</ul>

<h2>Step-by-Step Routine Maintenance</h2>
<ol>
  <li><strong>Annual tank flush</strong> — drain the tank fully to remove sediment settled at the bottom.</li>
  <li><strong>Inspect the anode rod</strong> — this sacrificial magnesium rod prevents tank corrosion; replace it every two years.</li>
  <li><strong>Test the pressure relief valve</strong> — it must open under excess pressure; if it does not, replace it immediately.</li>
  <li><strong>Clean the heating element</strong> — especially important in areas with hard water like Kuwait.</li>
  <li><strong>Check pipe insulation</strong> — properly insulated pipes reduce heat loss and lower running costs.</li>
</ol>

<blockquote>
  "A water heater serviced annually lasts twice as long as one that is neglected."
</blockquote>

<h2>When Should You Call a Professional?</h2>
<p>
If you notice any of the warning signs above, or if your water heater is more than
eight years old, book a service visit with <strong>Tashtibatk</strong>.
Our team carries out a full inspection, provides a written condition report, and
quotes any necessary replacements — all in a single visit.
</p>
""",
    },
    # ------------------------------------------------------------------ 5
    # AR twin: aataal-sibaka-shaeia-wa-isilahiha
    # UR twin: plumbing-ke-aam-masail-aur-hal
    {
        "slug": "common-plumbing-problems-at-home-and-how-to-fix-them",
        "translation_group": uuid.UUID("ef7954b5-6fb6-48c6-aec8-f6826d0af941"),
        "title": "Common Plumbing Problems at Home and How to Deal With Them",
        "meta_title": "Common Home Plumbing Problems | Tashtibatk",
        "meta_description": (
            "Tashtibatk covers the 5 most common household plumbing faults, what "
            "you can fix yourself, and when you need a professional on-site."
        ),
        "body": """
<h2>Plumbing Issues — Every Home Faces Them</h2>
<p>
No home is completely immune to plumbing faults. Some are easy enough to handle
yourself; others need a qualified technician from <strong>Tashtibatk</strong>
before a minor issue becomes a major — and expensive — problem.
Here are the five most common ones and exactly what to do about each.
</p>

<h2>The 5 Most Common Faults and Their Solutions</h2>

<h3>1. A Tap That Drips Constantly</h3>
<p>
The most frequent cause is a worn rubber washer inside the tap.
On a standard tap you can replace this yourself.
For a modern mixer tap, call a <strong>Tashtibatk</strong> technician to avoid
damaging the cartridge — a small repair cost is far less than a replacement mixer.
</p>

<h3>2. A Toilet That Keeps Running After Flushing</h3>
<p>
The culprit is usually a faulty float valve or a worn flapper.
If you hear a continuous trickle after flushing, both parts are inexpensive
and straightforward to replace.
</p>

<h3>3. Low Water Pressure in the Shower</h3>
<p>
Calcium deposits often clog the shower head — soak it in vinegar for a few hours.
If pressure remains low after cleaning, the issue may be in the supply pipes
and requires a professional check.
</p>

<h3>4. A Bad Smell Coming From the Drain</h3>
<p>
Start with boiling water, then a mixture of baking soda and white vinegar.
If the smell persists there is likely a partial blockage — professional
pressure jetting will clear it properly.
</p>

<h3>5. Leaking From Under the Sink</h3>
<p>
First tighten all hand-reachable joints firmly.
If the pipe body itself is leaking, replace it immediately — ignoring it will
damage the cabinet and the floor beneath.
</p>

<blockquote>
  "Every small problem you postpone today becomes a bigger bill tomorrow."
</blockquote>

<h2>When to Call Tashtibatk</h2>
<ul>
  <li>Any leak whose source you cannot identify.</li>
  <li>Water cutting out at more than one tap simultaneously.</li>
  <li>Damp patches appearing on walls or ceilings.</li>
  <li>Any fault involving buried or concealed pipes.</li>
</ul>
<p>
<strong>Tashtibatk</strong> covers all residential plumbing work with a skilled team
and professional equipment. Book your visit now and get a free fault diagnosis.
</p>
""",
    },
]


class Command(BaseCommand):
    help = "Seed 5 English plumbing articles linked to their AR/UR twins."

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
            if Article.objects.filter(language="en", slug=data["slug"]).exists():
                self.stdout.write(f"  skip  {data['slug']}")
                continue

            article = Article(
                translation_group=data["translation_group"],
                category=category,
                author=author,
                language="en",
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
