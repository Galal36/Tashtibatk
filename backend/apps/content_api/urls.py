from django.urls import path

from . import views

urlpatterns = [
    path("next/", views.next_topic),
    path("articles/", views.create_drafts),
    path("articles/<uuid:pk>/publish/", views.publish_submission),
    path("articles/<uuid:pk>/reject/", views.reject_submission),
    path("preview/<uuid:token>/", views.preview, name="content-preview"),
]
