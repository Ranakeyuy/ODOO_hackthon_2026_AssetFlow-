from django.urls import path
from core.views import (
    UserLoginView,
    UserRegisterView,
    DashboardView,
    AssetDirectoryView,
    BookingCalendarView,
    ApproveTransferView,
    RejectTransferView,
    ApproveMaintenanceView,
    ResolveMaintenanceView,
    UserProfileView,
    IoTTelemetryReceiveView,
)

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('register/', UserRegisterView.as_view(), name='register'),
    path('assets/', AssetDirectoryView.as_view(), name='asset_directory'),
    path('bookings/', BookingCalendarView.as_view(), name='booking_calendar'),
    path('transfers/<int:pk>/approve/', ApproveTransferView.as_view(), name='approve_transfer'),
    path('transfers/<int:pk>/reject/', RejectTransferView.as_view(), name='reject_transfer'),
    path('maintenance/<int:pk>/approve/', ApproveMaintenanceView.as_view(), name='approve_maintenance'),
    path('maintenance/<int:pk>/resolve/', ResolveMaintenanceView.as_view(), name='resolve_maintenance'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('accounts/profile/', UserProfileView.as_view()),
    path('api/iot/telemetry/', IoTTelemetryReceiveView.as_view(), name='iot_telemetry_receive'),
]
