from django.shortcuts import render, get_object_or_404, redirect
from django.views import View
from django.views.generic import CreateView, TemplateView
from django.contrib.auth.views import LoginView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.utils import timezone
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
from core.models import (
    User, Asset, AssetAllocation, ResourceBooking,
    TransferRequest, MaintenanceRequest, AssetCategory,
    IoTDevice, IoTAlert, SystemLog
)
from core.forms import (
    CustomUserCreationForm, AssetRegistrationForm,
    ResourceBookingForm, MaintenanceRequestForm, IoTDeviceForm
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
        context['iot_devices_count'] = IoTDevice.objects.count()
        context['active_alerts_count'] = IoTAlert.objects.filter(is_resolved=False).count()

        return context

class AssetDirectoryView(LoginRequiredMixin, View):
    template_name = 'core/asset_directory.html'

    def get_queryset(self, request):
        queryset = Asset.objects.select_related('category').prefetch_related('allocations__user').order_by('category__name', 'tag')
        q = request.GET.get('q')
        tag = request.GET.get('tag')
        serial_number = request.GET.get('serial_number')
        status = request.GET.get('status')
        category = request.GET.get('category')
        location = request.GET.get('location')

        if q:
            queryset = queryset.filter(
                Q(tag__icontains=q) |
                Q(name__icontains=q) |
                Q(serial_number__icontains=q) |
                Q(attributes__icontains=q) |
                Q(iot_device__device_id__icontains=q)
            )
        if tag:
            queryset = queryset.filter(tag__icontains=tag)
        if serial_number:
            queryset = queryset.filter(serial_number__icontains=serial_number)
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
        if request.POST.get('action') == 'update_status':
            if request.user.role not in [User.ADMIN, User.ASSET_MANAGER]:
                return JsonResponse({'error': 'Permission denied'}, status=403)
            asset_id = request.POST.get('asset_id')
            new_status = request.POST.get('status')
            if asset_id and new_status:
                asset = get_object_or_404(Asset, pk=asset_id)
                if new_status in dict(Asset.STATUS_CHOICES):
                    asset.status = new_status
                    asset.save()
                    return JsonResponse({
                        'success': True,
                        'new_status': asset.get_status_display(),
                        'status_code': asset.status
                    })
                return JsonResponse({'error': 'Invalid status'}, status=400)
            return JsonResponse({'error': 'Missing fields'}, status=400)
        elif request.POST.get('action') == 'return_asset':
            if request.user.role not in [User.ADMIN, User.ASSET_MANAGER]:
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden("Permission denied")
            asset_id = request.POST.get('asset_id')
            if asset_id:
                asset = get_object_or_404(Asset, pk=asset_id)
                active_alloc = AssetAllocation.objects.filter(asset=asset, actual_return_date__isnull=True).first()
                if active_alloc:
                    active_alloc.actual_return_date = timezone.now().date()
                    active_alloc.save()
                else:
                    asset.status = Asset.AVAILABLE
                    asset.save()
                return redirect('asset_directory')

        if request.user.role not in [User.ADMIN, User.ASSET_MANAGER]:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden("Permission denied")
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

@method_decorator(csrf_exempt, name='dispatch')
class IoTTelemetryReceiveView(View):
    def post(self, request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or auth_header != 'Bearer secure_iot_telemetry_token_2026':
            return JsonResponse({"error": "Unauthorized access"}, status=401)
        try:
            data = json.loads(request.body)
            device_id = data.get('device_id')
            telemetry_data = data.get('telemetry')
            if not device_id or not telemetry_data:
                return JsonResponse({"error": "Missing device_id or telemetry data."}, status=400)
            device = get_object_or_404(IoTDevice, device_id=device_id)
            device.record_telemetry(telemetry_data)
            return JsonResponse({"status": "Telemetry recorded successfully."})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON payload."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class IoTDeviceListView(LoginRequiredMixin, View):
    template_name = 'core/iot_dashboard.html'

    def get_context(self, form=None):
        return {
            'devices': IoTDevice.objects.select_related('asset').all(),
            'active_alerts': IoTAlert.objects.filter(is_resolved=False).select_related('iot_device__asset').order_by('-created_at'),
            'resolved_alerts': IoTAlert.objects.filter(is_resolved=True).select_related('iot_device__asset').order_by('-resolved_at')[:20],
            'form': form or IoTDeviceForm(),
            'available_assets_no_iot': Asset.objects.filter(iot_device__isnull=True),
        }

    def get(self, request):
        return render(request, self.template_name, self.get_context())

    def post(self, request):
        if request.user.role not in [User.ADMIN, User.ASSET_MANAGER]:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden("Permission denied")
        form = IoTDeviceForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('iot_dashboard')
        return render(request, self.template_name, self.get_context(form))

class ResolveIoTAlertView(LoginRequiredMixin, View):
    def post(self, request, pk):
        if request.user.role not in [User.ADMIN, User.ASSET_MANAGER]:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden("Permission denied")
        alert = get_object_or_404(IoTAlert, pk=pk)
        alert.resolve()
        
        # Transition device status back to ONLINE if no more unresolved alerts remain
        device = alert.iot_device
        if not device.alerts.filter(is_resolved=False).exists():
            device.status = IoTDevice.ONLINE
            device.save()
            
        return redirect('iot_dashboard')

class SystemLogListView(LoginRequiredMixin, View):
    template_name = 'core/system_logs.html'

    def get(self, request):
        if request.user.role not in [User.ADMIN, User.ASSET_MANAGER]:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden("Permission denied")
            
        queryset = SystemLog.objects.select_related('actor', 'target_asset').order_by('-timestamp')
        
        # Filtering
        action_type = request.GET.get('action_type')
        q = request.GET.get('q')
        
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        if q:
            queryset = queryset.filter(
                Q(action__icontains=q) | 
                Q(target_asset_tag__icontains=q) |
                Q(actor__username__icontains=q)
            )
            
        action_types = SystemLog.objects.values_list('action_type', flat=True).distinct()
        
        context = {
            'logs': queryset,
            'action_types': action_types,
            'selected_action_type': action_type,
            'q': q,
        }
        return render(request, self.template_name, context)
