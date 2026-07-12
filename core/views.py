from django.shortcuts import render, get_object_or_404, redirect
from django.views import View
from django.views.generic import CreateView, TemplateView
from django.contrib.auth.views import LoginView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.utils import timezone
from django.db.models import Q
from core.models import (
    User, Asset, AssetAllocation, ResourceBooking,
    TransferRequest, MaintenanceRequest, AssetCategory,
)
from core.forms import (
    CustomUserCreationForm, AssetRegistrationForm,
    ResourceBookingForm, MaintenanceRequestForm,
)


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
        context['active_bookings'] = ResourceBooking.objects.filter(
            is_cancelled=False, end_time__gt=now
        ).count()
        context['pending_transfers'] = TransferRequest.objects.filter(
            status=TransferRequest.REQUESTED
        ).count()
        context['maintenance_today_count'] = MaintenanceRequest.objects.filter(
            created_at__date=today,
            status__in=[
                MaintenanceRequest.PENDING,
                MaintenanceRequest.APPROVED,
                MaintenanceRequest.TECHNICIAN_ASSIGNED,
                MaintenanceRequest.IN_PROGRESS,
            ],
        ).count()
        context['overdue_returns'] = AssetAllocation.objects.filter(
            actual_return_date__isnull=True,
            expected_return_date__lt=today,
        ).select_related('asset', 'user')

        return context


class AssetDirectoryView(LoginRequiredMixin, View):
    template_name = 'core/asset_directory.html'

    def get_queryset(self, request):
        queryset = Asset.objects.select_related('category').order_by('tag')
        q = request.GET.get('q')
        status = request.GET.get('status')
        category = request.GET.get('category')
        location = request.GET.get('location')

        if q:
            queryset = queryset.filter(
                Q(tag__icontains=q) | Q(name__icontains=q) | Q(serial_number__icontains=q)
            )
        if status:
            queryset = queryset.filter(status=status)
        if category:
            queryset = queryset.filter(category_id=category)
        if location:
            queryset = queryset.filter(location__icontains=location)

        return queryset

    def get(self, request, *args, **kwargs):
        selected_asset = None
        selected_asset_id = request.GET.get('selected_asset_id')
        if selected_asset_id:
            selected_asset = get_object_or_404(
                Asset.objects.prefetch_related('allocations__user'), pk=selected_asset_id
            )

        context = {
            'object_list': self.get_queryset(request),
            'form': AssetRegistrationForm(),
            'categories': AssetCategory.objects.all(),
            'selected_asset': selected_asset,
            'Asset': Asset,
        }
        return render(request, self.template_name, context)

    def post(self, request, *args, **kwargs):
        form = AssetRegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('asset_directory')

        context = {
            'object_list': self.get_queryset(request),
            'form': form,
            'categories': AssetCategory.objects.all(),
            'Asset': Asset,
        }
        return render(request, self.template_name, context)


class BookingCalendarView(LoginRequiredMixin, View):
    template_name = 'core/booking_calendar.html'

    def get_context(self, form):
        return {
            'bookings': ResourceBooking.objects.filter(
                is_cancelled=False, end_time__gt=timezone.now()
            ).select_related('resource', 'user').order_by('start_time'),
            'form': form,
            'shared_assets': Asset.objects.filter(is_shared=True),
        }

    def get(self, request):
        return render(request, self.template_name, self.get_context(ResourceBookingForm()))

    def post(self, request):
        form = ResourceBookingForm(request.POST)
        if form.is_valid():
            booking = form.save(commit=False)
            booking.user = request.user
            booking.save()
            return redirect('booking_calendar')
        return render(request, self.template_name, self.get_context(form))


class ApproveTransferView(LoginRequiredMixin, IsAdminOrManagerMixin, View):
    def post(self, request, pk):
        transfer = get_object_or_404(TransferRequest, pk=pk)
        transfer.approve(approved_by=request.user)
        return redirect('dashboard')


class RejectTransferView(LoginRequiredMixin, IsAdminOrManagerMixin, View):
    def post(self, request, pk):
        transfer = get_object_or_404(TransferRequest, pk=pk)
        transfer.reject(rejected_by=request.user)
        return redirect('dashboard')


class ApproveMaintenanceView(LoginRequiredMixin, IsAdminOrManagerMixin, View):
    def post(self, request, pk):
        maintenance = get_object_or_404(MaintenanceRequest, pk=pk)
        maintenance.status = MaintenanceRequest.APPROVED
        maintenance.save()
        return redirect('dashboard')


class ResolveMaintenanceView(LoginRequiredMixin, IsAdminOrManagerMixin, View):
    def post(self, request, pk):
        maintenance = get_object_or_404(MaintenanceRequest, pk=pk)
        maintenance.status = MaintenanceRequest.RESOLVED
        maintenance.save()
        return redirect('dashboard')


class UserProfileView(LoginRequiredMixin, TemplateView):
    template_name = 'core/profile.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['allocations'] = AssetAllocation.objects.filter(
            user=self.request.user, actual_return_date__isnull=True
        ).select_related('asset')
        context['bookings'] = ResourceBooking.objects.filter(
            user=self.request.user, is_cancelled=False, end_time__gt=timezone.now()
        ).select_related('resource')
        return context
