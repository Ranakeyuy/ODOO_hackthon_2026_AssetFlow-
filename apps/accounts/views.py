from typing import Any
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, get_user_model
from django.contrib.auth.views import LoginView, LogoutView
from django.views.generic import CreateView, TemplateView, RedirectView
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.core.exceptions import PermissionDenied

from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.forms import CustomUserCreationForm, RememberMeAuthenticationForm
from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer, RegisterSerializer, RolePromotionSerializer

# --- SESSION / TEMPLATE VIEWS ---

class UserRegisterView(CreateView):
    form_class = CustomUserCreationForm
    template_name = 'accounts/register.html'
    success_url = reverse_lazy('login')

class UserLoginView(LoginView):
    form_class = RememberMeAuthenticationForm
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True

    def form_valid(self, form: RememberMeAuthenticationForm) -> HttpResponse:
        remember_me = form.cleaned_data.get('remember_me')
        if not remember_me:
            # Browser session login (expires when browser closed)
            self.request.session.set_expiry(0)
        else:
            # 2 weeks expiry
            self.request.session.set_expiry(1209600)
        return super().form_valid(form)

class UserLogoutView(LogoutView):
    next_page = reverse_lazy('login')

class RootRedirectView(RedirectView):
    permanent = False

    def get_redirect_url(self, *args: Any, **kwargs: Any) -> str:
        if self.request.user.is_authenticated:
            return reverse_lazy('profile')
        return reverse_lazy('login')

class ProfileView(LoginRequiredMixin, TemplateView):
    template_name = 'accounts/profile.html'

# --- API VIEWS (DRF + JWT) ---

class APIRegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request: HttpRequest, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Issue JWT tokens on successful registration
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self) -> User:
        return self.request.user

class APIRolePromotionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> Response:
        serializer = RolePromotionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Explicit authorization check in controller
        if request.user.role != User.ADMIN and not request.user.is_superuser:
            return Response(
                {"detail": "Only Administrators can modify user roles."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        promoted_user = serializer.update_role(actor=request.user)
        return Response({
            "status": "success",
            "message": f"User {promoted_user.username} promoted to {promoted_user.get_role_display()}",
            "user": UserSerializer(promoted_user).data
        }, status=status.HTTP_200_OK)
