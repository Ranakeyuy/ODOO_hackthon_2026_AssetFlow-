from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views # Import Django's built-in auth views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'), # Added logout URL
]
