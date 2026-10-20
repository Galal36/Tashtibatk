# Service Online — multilingual home-services platform

SEO-first website + CMS for home services (finishing, plumbing, carpentry,
montage, furniture moving, landscaping, cleaning, heavy-equipment rental).
Trilingual: **Arabic (default, RTL), English (LTR), Urdu (RTL)**.

> **Clone-friendly:** nothing is hard-coded to a country. Country, domain,
> site name and locales all live in env files (`backend/.env`,
> `frontend/.env.local`). To launch a second-country clone, copy the folder,
> create a new DB + user, and change those env values — no code edits.

## Stack
| Layer | Tech | Port (local) |
|---|---|---|
| Frontend | Next.js 14 (App Router, TS, Tailwind) + next-intl | `3010` |
| Backend | Django 5 + DRF (session auth) | `8012` |
| DB | PostgreSQL (`service_online_db`) | `5432` |

## Architecture decisions (and why they differ from the first draft)
- **Auth = Django session cookies**, not JWT-in-localStorage. The dashboard is
  first-party and same-origin behind nginx, so sessions are simpler and immune
  to token-theft via XSS.
- **`Article.translation_group`** links the AR/EN/UR versions of one topic, so
  hreflang tags and the editor's language switcher generate automatically
  instead of being wired by hand per article.
- **Slugs are unique per `(language, slug)`**, not globally — required for a
  multilingual site.
- **Article bodies are sanitized with `nh3`** on every save (stored-XSS defence)
  since the rich editor produces HTML rendered by the frontend.
- **`effective_meta_description`** strips HTML before truncating, so meta tags
  never contain broken markup.
- **`og_image` is an `ImageField`** (real uploads to `/media/`), not a URL field.
- **ISR + revalidate webhook**: Django pings `POST /api/revalidate` on publish,
  so statically generated pages refresh instantly (speed of SSG, freshness of SSR).
- **Routing ownership**: Next owns all public pages; Django owns
  `/api`, `/admin`, `/static`, `/media`, and **`/sitemap.xml` + `/robots.txt`**
  (generated with per-language `xhtml:link` hreflang alternates).

## Roles
- **admin** — full CRUD + user management (`/api/users/`) + Django admin.
- **moderator** — articles, service pages, contacts. No user management.
Enforced by DRF permission classes in `apps/accounts/permissions.py`.

## Local development
```bash
# Backend
cd backend
venv/bin/python manage.py migrate
venv/bin/python manage.py seed_services        # 8 service categories (idempotent)
venv/bin/python manage.py runserver 127.0.0.1:8012

# Frontend (separate shell)
cd frontend
npm run dev -- -p 3010     # or: npm run build && npm start -- -p 3010
```
Visit `http://localhost:3010/ar` (Arabic, RTL). Dashboard: `/ar/dashboard`.

## Key API endpoints
| Method | Path | Auth |
|---|---|---|
| GET | `/api/categories/?lang=ar` | public |
| GET | `/api/articles/?lang=ar&category=plumbing` | public (published only) |
| GET | `/api/articles/<slug>/?lang=ar` | public |
| POST | `/api/contact/` | public (website form) |
| POST | `/api/auth/login/` · `/api/auth/logout/` · GET `/api/auth/me/` | session |
| CRUD | `/api/articles/`, `/api/service-pages/`, `/api/contacts/` | staff |
| CRUD | `/api/users/` | admin only |
| GET | `/sitemap.xml`, `/robots.txt` | public |

## Production deploy (when domains are ready)
Templates in `deploy/` — **not yet installed** (no nginx/SSL changes were made):
1. `service_online-backend.service` — Gunicorn on 8012
2. `service_online-frontend.service` — Next.js on 3010
3. `nginx.conf.template` — vhost (replace `REPLACE_ME_DOMAIN`, then certbot)

Before going live: set `DJANGO_DEBUG=False`, real `DJANGO_ALLOWED_HOSTS`,
`SITE_DOMAIN`/`NEXT_PUBLIC_SITE_URL` to the https domain, configure SMTP, and
run `manage.py collectstatic`.

## Design references
`docs/` holds the original ERD, Django model, dashboard wireframe and SEO-panel
mockups that informed this build.
