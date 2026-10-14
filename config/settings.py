"""
Django settings for the Service-Online platform.

Everything that differs between country clones lives in the .env file
(SITE_NAME, SITE_COUNTRY, LOCALES, domain, DB creds...). No country name
is hard-coded here, so this project can be cloned 1:1 for another market.
"""
from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env(key, default=""):
    return os.environ.get(key, default)


def env_list(key, default=""):
    raw = env(key, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def env_bool(key, default=False):
    return env(key, str(default)).strip().lower() in ("1", "true", "yes", "on")


# ── Core ────────────────────────────────────────────────────────────────
SECRET_KEY = env("DJANGO_SECRET_KEY", "dev-insecure-key-change-me")
DEBUG = env_bool("DJANGO_DEBUG", False)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost")

# ── Site identity (consumed by API + SEO helpers) ───────────────────────
SITE_NAME = env("SITE_NAME", "Service Online")
SITE_COUNTRY = env("SITE_COUNTRY", "")
SITE_COUNTRY_CODE = env("SITE_COUNTRY_CODE", "")
SITE_DOMAIN = env("SITE_DOMAIN", "http://localhost:3010")
DEFAULT_LOCALE = env("DEFAULT_LOCALE", "ar")
LOCALES = env_list("LOCALES", "ar,en,ur")

# ── Applications ────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sitemaps",
    # third party
    "rest_framework",
    "corsheaders",
    # local
    "apps.accounts",
    "apps.services",
    "apps.articles",
    "apps.contacts",
    "apps.media",
    "apps.content_api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ── Database ────────────────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("DB_NAME", "service_online_db"),
        "USER": env("DB_USER", "service_online_user"),
        "PASSWORD": env("DB_PASSWORD", ""),
        "HOST": env("DB_HOST", "127.0.0.1"),
        "PORT": env("DB_PORT", "5432"),
        "CONN_MAX_AGE": 60,
    }
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── i18n / tz ───────────────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kuwait"
USE_I18N = True
USE_TZ = True

# ── Static / media ──────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Admin media-library / image uploads
MAX_IMAGE_UPLOAD_SIZE = 8 * 1024 * 1024  # 8 MB
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── DRF: session auth (HttpOnly cookie) — safer than JWT for a
#    first-party, same-origin dashboard. ─────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# ── CORS / CSRF (Next.js frontend) ──────────────────────────────────────
FRONTEND_ORIGINS = env_list("FRONTEND_ORIGINS", "http://localhost:3010")
CORS_ALLOWED_ORIGINS = FRONTEND_ORIGINS
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = FRONTEND_ORIGINS

# Behind nginx TLS termination in production
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True

# ── ISR revalidation webhook to Next.js ─────────────────────────────────
REVALIDATE_URL = env("REVALIDATE_URL", "")
REVALIDATE_SECRET = env("REVALIDATE_SECRET", "")

# ── Email (contact form notifications) ──────────────────────────────────
if env("EMAIL_HOST"):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST")
EMAIL_PORT = int(env("EMAIL_PORT", "587") or 587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "no-reply@example.com")
CONTACT_NOTIFY_EMAIL = env("CONTACT_NOTIFY_EMAIL")

# ── Content automation API (n8n) ──
# Shared secret sent by n8n in the X-Content-Token header. Empty = API disabled.
CONTENT_API_TOKEN = env("CONTENT_API_TOKEN", "")
