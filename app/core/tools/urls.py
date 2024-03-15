from django.urls import path
from .views import SearchDni

urlpatterns = [
    path('search-dni/', SearchDni.as_view(), name='search-dni'),
]