"""Test settings: SQLite, because the production DB role cannot create databases."""
from .settings import *  # noqa: F401,F403

DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
REVALIDATE_URL = ""
CONTENT_API_TOKEN = "test-token"
SITE_DOMAIN = "https://example.test"
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
