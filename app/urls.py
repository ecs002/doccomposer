from django.urls import path
from . import views

app_name = "app"

urlpatterns = [
    path("", views.home, name="home"),
    path("signin", views.signin_view, name="signin"),
    path("signout", views.signout_view, name="signout"),
    path("register", views.register, name="register"),
    path("docs",views.docs,name="docs"),
    path("create",views.createDoc,name="createDoc"),
    path("<uuid:uuidStr>/edit", views.editDoc, name="editDoc"),
    path("<uuid:uuidStr>/preview", views.previewDoc, name="previewDoc"),
    path("<uuid:uuidStr>", views.form, name="form"),
    path("<uuid:uuidStr>/thankYou", views.thankYou, name="thankYou"),

    #API routes
    path("<uuid:uuidStr>/getData",views.getData, name="getData"),
    path("<uuid:uuidStr>/updateData",views.updateData, name="updateData"),
    path("<uuid:uuidStr>/getTemplate",views.getTemplate, name="getTemplate"),
    path("<uuid:uuidStr>/updateTemplate",views.updateTemplate, name="updateTemplate"),
    path("<uuid:uuidStr>/getDocument",views.getDocument, name="getDocument"),
    path("<uuid:uuidStr>/updateStatus",views.updateStatus, name="updateStatus"),
]