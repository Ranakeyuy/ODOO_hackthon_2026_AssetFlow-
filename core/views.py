from django.shortcuts import render, get_object_or_404, redirect
from django.views import View
from django.views.generic import ListView, CreateView, TemplateView
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from core.models import User, Asset, AssetAllocation, ResourceBooking, TransferRequest, MaintenanceRequest
from core.forms import CustomUserCreationForm, ResourceBookingForm

class IsAdminOrManagerMixin(UserPassesTestMixin):
    def test_func(self):
        return self.request.user.role in [User.ADMIN, User.ASSET_MANAGER]


class UserLoginView(LoginView):
    template_name = 'core/login.html'
    redirect_authenticated_user = True

class UserRegisterView(CreateView):
    form_class = CustomUserCreationForm
    template_name = 'core/register.html'
    success_url = reverse_lazy('login')

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'core/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        now = timezone.now()
        today = now.date()
        
        context['available_assets'] = Asset.objects.filter(status=Asset.AVAILABLE).count()
        context['allocated_assets'] = Asset.objects.filter(status=Asset.ALLOCATED).count()
        context['active_bookings'] = ResourceBooking.objects.filter(end_time__gt=now).count()
        context['pending_transfers'] = TransferRequest.objects.filter(status=TransferRequest.REQUESTED).count()
        
        context['overdue_returns'] = AssetAllocation.objects.filter(
            actual_return_date__isnull=True,
            expected_return_date__lt=today
        ).select_related('asset', 'user')
        
        return context

class AssetDirectoryView(LoginRequiredMixin, ListView):
    model = Asset
    template_name = 'core/asset_directory.html'
    context_object_name = 'assets'

    def get_queryset(self):
        queryset = super().get_queryset()
        q = self.request.GET.get('q')
        status = self.request.GET.get('status')
        category = self.request.GET.get('category')
        location = self.request.GET.get('location')

        if q:
            queryset = queryset.filter(
                Q(tag__icontains=q) |
                Q(name__icontains=q) |
                Q(serial_number__icontains=q)
            )
        if status:
            queryset = queryset.filter(status=status)
        if category:
            queryset = queryset.filter(category_id=category)
        if location:
            queryset = queryset.filter(location__icontains=location)
            
        return queryset

class BookingCalendarView(LoginRequiredMixin, View):
    def get(self, request):
        bookings = ResourceBooking.objects.filter(end_time__gt=timezone.now()).select_related('resource', 'user')
        form = ResourceBookingForm()
        return render(request, 'core/booking_calendar.html', {'bookings': bookings, 'form': form})

    def post(self, request):
        form = ResourceBookingForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('booking_calendar')
        bookings = ResourceBooking.objects.filter(end_time__gt=timezone.now()).select_related('resource', 'user')
        return render(request, 'core/booking_calendar.html', {'bookings': bookings, 'form': form})

class ApproveTransferView(LoginRequiredMixin, IsAdminOrManagerMixin, View):
    def post(self, request, pk):
        transfer_request = get_object_or_404(TransferRequest, pk=pk)
        transfer_request.approve(approved_by=request.user)
        return redirect('dashboard')

class ApproveMaintenanceView(LoginRequiredMixin, IsAdminOrManagerMixin, View):
    def post(self, request, pk):
        maintenance_request = get_object_or_404(MaintenanceRequest, pk=pk)
        maintenance_request.approve()
        return redirect('dashboard')

class ResolveMaintenanceView(LoginRequiredMixin, IsAdminOrManagerMixin, View):
    def post(self, request, pk):
        maintenance_request = get_object_or_404(MaintenanceRequest, pk=pk)
        maintenance_request.resolve()
        return redirect('dashboard')

class UserProfileView(LoginRequiredMixin, TemplateView):
    template_name = 'core/profile.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['allocations'] = AssetAllocation.objects.filter(user=self.request.user, actual_return_date__isnull=True).select_related('asset')
        context['bookings'] = ResourceBooking.objects.filter(user=self.request.user, end_time__gt=timezone.now()).select_related('resource')
        return context

