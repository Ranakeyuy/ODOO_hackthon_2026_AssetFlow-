from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.accounts.views import (
    UserRegisterView,
    UserLoginView,
    UserLogoutView,
    ProfileView,
    APIRegisterView,
    UserProfileAPIView,
    APIRolePromotionView,
    RootRedirectView
)

urlpatterns = [
    # Session / Template Auth
    path('', RootRedirectView.as_view(), name='root_redirect'),
    path('register/', UserRegisterView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),

    # REST API Auth & JWT
    path('api/register/', APIRegisterView.as_view(), name='api_register'),
    path('api/profile/', UserProfileAPIView.as_view(), name='api_profile'),
    path('api/promote/', APIRolePromotionView.as_view(), name='api_promote'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
