from django.db import models, transaction
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone

class User(AbstractUser):
    ADMIN = 'ADMIN'
    ASSET_MANAGER = 'ASSET_MANAGER'
    DEPARTMENT_HEAD = 'DEPARTMENT_HEAD'
    EMPLOYEE = 'EMPLOYEE'
    
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (ASSET_MANAGER, 'Asset Manager'),
        (DEPARTMENT_HEAD, 'Department Head'),
        (EMPLOYEE, 'Employee'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=EMPLOYEE
    )

class Department(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children'
    )
    head = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_departments'
    )

    def __str__(self):
        return self.name

class AssetCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    schema = models.JSONField(default=dict)

    def __str__(self):
        return self.name

class Asset(models.Model):
    AVAILABLE = 'AVAILABLE'
    ALLOCATED = 'ALLOCATED'
    RESERVED = 'RESERVED'
    UNDER_MAINTENANCE = 'UNDER_MAINTENANCE'
    LOST = 'LOST'
    RETIRED = 'RETIRED'
    DISPOSED = 'DISPOSED'
    
    STATUS_CHOICES = [
        (AVAILABLE, 'Available'),
        (ALLOCATED, 'Allocated'),
        (RESERVED, 'Reserved'),
        (UNDER_MAINTENANCE, 'Under Maintenance'),
        (LOST, 'Lost'),
        (RETIRED, 'Retired'),
        (DISPOSED, 'Disposed'),
    ]
    
    tag = models.CharField(max_length=50, unique=True, blank=True)
    name = models.CharField(max_length=200)
    serial_number = models.CharField(max_length=100, blank=True)
    category = models.ForeignKey(
        AssetCategory,
        on_delete=models.CASCADE,
        related_name='assets'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=AVAILABLE
    )
    location = models.CharField(max_length=200, blank=True)
    is_shared = models.BooleanField(default=False)
    attributes = models.JSONField(default=dict, blank=True)

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        with transaction.atomic():
            if not self.tag:
                last_asset = Asset.objects.select_for_update().order_by('-id').first()
                last_id = last_asset.id if last_asset else 0
                self.tag = f"AF-{(last_id + 1):04d}"
            
            old_status = None
            if not is_new:
                try:
                    old_status = Asset.objects.get(pk=self.pk).status
                except Asset.DoesNotExist:
                    is_new = True
                
            super().save(*args, **kwargs)
            
            if not is_new and old_status != self.status:
                SystemLog.objects.create(
                    target_asset=self,
<<<<<<< Updated upstream
                    action_type="STATE_CHANGE",
                    action=f"Asset {self.tag} status shifted from {old_status} to {self.status}."
=======
                    action_type='STATE_CHANGE',
                    action=( # Corrected variable name from original_status to self._original_status
                        f"Asset '{self.tag}' status changed from "
                        f"'{self._original_status}' to '{self.status}'."
                    ),
>>>>>>> Stashed changes
                )

    def __str__(self):
        return f"{self.name} ({self.tag})"

class AssetAllocation(models.Model):
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='allocations'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='allocations'
    )
    checked_out_at = models.DateTimeField(default=timezone.now)
    expected_return_date = models.DateField(null=True, blank=True)
    actual_return_date = models.DateField(null=True, blank=True)

    def clean(self):
        is_new = self._state.adding
        if is_new or self.actual_return_date is None:
            if self.asset.status != Asset.AVAILABLE:
                active_alloc = AssetAllocation.objects.filter(
                    asset=self.asset,
                    actual_return_date__isnull=True
                )
                if self.pk:
                    active_alloc = active_alloc.exclude(pk=self.pk)
                active_alloc = active_alloc.first()
                holder_name = "Unknown"
                if active_alloc:
                    holder_name = active_alloc.user.get_full_name() or active_alloc.user.username
                    raise ValidationError(f"Asset is not available. Currently held by {holder_name}.")

    def save(self, *args, **kwargs):
        self.clean()
        is_new = self._state.adding
        with transaction.atomic():
            super().save(*args, **kwargs)
            if is_new and self.actual_return_date is None:
                self.asset.status = Asset.ALLOCATED
                self.asset.save()
                SystemLog.objects.create(
                    target_asset=self.asset,
                    action_type="ALLOCATION_OPEN",
                    action=f"Asset {self.asset.tag} allocated to {self.user.username}."
                )
            elif self.actual_return_date is not None:
                self.asset.status = Asset.AVAILABLE
                self.asset.save()
                SystemLog.objects.create(
                    target_asset=self.asset,
                    action_type="ALLOCATION_CLOSE",
                    action=f"Asset {self.asset.tag} returned by {self.user.username}."
                )

class ResourceBooking(models.Model):
    resource = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_cancelled = models.BooleanField(default=False)

    def clean(self):
        if self.start_time and self.end_time:
            if self.start_time >= self.end_time:
                raise ValidationError("Start time must be before end time.")
            with transaction.atomic():
                Asset.objects.select_for_update().get(pk=self.resource_id)
                overlapping = ResourceBooking.objects.filter(
                    resource=self.resource,
                    is_cancelled=False,
                    start_time__lt=self.end_time,
                    end_time__gt=self.start_time
                )
                if self.pk:
                    overlapping = overlapping.exclude(pk=self.pk)
                if overlapping.exists():
                    raise ValidationError("This booking overlaps with an existing reservation.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

class TransferRequest(models.Model):
    REQUESTED = 'REQUESTED'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    
    STATUS_CHOICES = [
        (REQUESTED, 'Requested'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    ]
    
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='transfer_requests'
    )
    from_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_transfers'
    )
    to_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_transfers'
    )
    requested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='requested_transfers'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=REQUESTED
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def approve(self, approved_by=None):
        if self.status == self.REQUESTED:
            with transaction.atomic():
                active_alloc = AssetAllocation.objects.filter(
                    asset=self.asset,
                    actual_return_date__isnull=True
                ).first()
                if active_alloc:
                    active_alloc.actual_return_date = timezone.now().date()
                    active_alloc.save()
                
                self.asset.refresh_from_db()
                AssetAllocation.objects.create(
                    asset=self.asset,
                    user=self.to_user,
                    checked_out_at=timezone.now()
                )
                
                self.asset.status = Asset.ALLOCATED
                self.asset.save()
                
                self.status = self.APPROVED
                self.save()
                
                SystemLog.objects.create(
                    actor=approved_by,
                    target_asset=self.asset,
                    action_type="TRANSFER_APPROVAL",
                    action=f"Approved transfer request of asset {self.asset.tag} from {self.from_user.username} to {self.to_user.username}."
                )

class MaintenanceRequest(models.Model):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    TECHNICIAN_ASSIGNED = 'TECHNICIAN_ASSIGNED'
    IN_PROGRESS = 'IN_PROGRESS'
    RESOLVED = 'RESOLVED'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (TECHNICIAN_ASSIGNED, 'Technician Assigned'),
        (IN_PROGRESS, 'In Progress'),
        (RESOLVED, 'Resolved'),
    ]
    
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='maintenance_requests'
    )
    requested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='maintenance_requests'
    )
    description = models.TextField()
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    _original_status = None # To store the original status before save

    def save(self, *args, **kwargs):
<<<<<<< Updated upstream
        is_new = self._state.adding
        old_status = None
        if not is_new:
            try:
                old_status = MaintenanceRequest.objects.get(pk=self.pk).status
            except MaintenanceRequest.DoesNotExist:
                pass
        
        with transaction.atomic():
            super().save(*args, **kwargs)
            
            if self.status == self.APPROVED and old_status != self.APPROVED:
                self.asset.status = Asset.UNDER_MAINTENANCE
                self.asset.save()
            elif self.status == self.RESOLVED and old_status != self.RESOLVED:
                self.asset.status = Asset.AVAILABLE
                self.asset.save()
=======
        with transaction.atomic():
            if self.pk: # Only fetch old status if it's an existing object
                self._original_status = MaintenanceRequest.objects.get(pk=self.pk).status
            if self.status == self.RESOLVED and self.resolved_at is None:
                self.resolved_at = timezone.now()
            super().save(*args, **kwargs)
            if self.status == self.APPROVED and self._original_status != self.APPROVED:
                Asset.objects.filter(pk=self.asset.pk).update(status=Asset.UNDER_MAINTENANCE)
                self.asset.refresh_from_db(fields=['status'])
                SystemLog.objects.create(
                    target_asset=self.asset,
                    action_type='MAINTENANCE_START',
                    action=(
                        f"Asset '{self.asset.tag}' placed under maintenance. "
                        f"Request raised by '{self.requested_by.username}'."
                    ),
                )
            elif self.status == self.RESOLVED and self._original_status != self.RESOLVED:
                Asset.objects.filter(pk=self.asset.pk).update(status=Asset.AVAILABLE)
                self.asset.refresh_from_db(fields=['status'])
                SystemLog.objects.create(
                    target_asset=self.asset,
                    action_type='MAINTENANCE_END',
                    action=(
                        f"Asset '{self.asset.tag}' maintenance resolved. "
                        f"Status restored to Available on {self.resolved_at.date()}."
                    ),
                )

>>>>>>> Stashed changes

class AuditCycle(models.Model):
    title = models.CharField(max_length=200)
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='audit_cycles',
        null=True,
        blank=True
    )
    location = models.CharField(max_length=200, blank=True)
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    is_closed = models.BooleanField(default=False)

    def close_cycle(self, actor=None):
        if not self.is_closed:
            with transaction.atomic():
                self.is_closed = True
                self.end_date = timezone.now().date()
                self.save()
                
                missing_entries = self.entries.filter(status='MISSING')
                asset_ids = missing_entries.values_list('asset_id', flat=True)
                
                Asset.objects.filter(id__in=asset_ids).update(status=Asset.LOST)
                
                for asset_id in asset_ids:
                    SystemLog.objects.create(
                        actor=actor,
                        action=f"Asset ID {asset_id} marked as LOST due to missing audit entry."
                    )

class AuditEntry(models.Model):
    PENDING = 'PENDING'
    VERIFIED = 'VERIFIED'
    MISSING = 'MISSING'
    DAMAGED = 'DAMAGED'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (VERIFIED, 'Verified'),
        (MISSING, 'Missing'),
        (DAMAGED, 'Damaged'),
    ]
    
    cycle = models.ForeignKey(
        AuditCycle,
        on_delete=models.CASCADE,
        related_name='entries'
    )
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='audit_entries'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING
    )
    notes = models.TextField(blank=True)

class SystemLog(models.Model):
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_logs'
    )
    target_asset = models.ForeignKey(
        Asset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_logs'
    )
    action_type = models.CharField(max_length=50, blank=True)
    action = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class IoTDevice(models.Model):
    ONLINE = 'ONLINE'
    OFFLINE = 'OFFLINE'
    ALERT = 'ALERT'

    STATUS_CHOICES = [
        (ONLINE, 'Online'),
        (OFFLINE, 'Offline'),
        (ALERT, 'Alert'),
    ]

    asset = models.OneToOneField(
        Asset,
        on_delete=models.CASCADE,
        related_name='iot_device'
    )
    device_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=OFFLINE
    )
    last_heartbeat = models.DateTimeField(null=True, blank=True)
    telemetry = models.JSONField(default=dict, blank=True)
    alert_thresholds = models.JSONField(default=dict, blank=True)

    def record_telemetry(self, data):
        with transaction.atomic():
            self.last_heartbeat = timezone.now()
            self.telemetry = data
            self.status = self.ONLINE

            temp = data.get('temperature')
            max_temp = self.alert_thresholds.get('max_temperature')
            if temp is not None and max_temp is not None:
                if temp > max_temp:
                    self.status = self.ALERT
                    IoTAlert.objects.create(
                        iot_device=self,
                        alert_type="TEMPERATURE_HIGH",
                        severity="CRITICAL",
                        message=f"High temperature detected: {temp}°C (Threshold: {max_temp}°C)."
                    )
                    self.asset.status = Asset.UNDER_MAINTENANCE
                    self.asset.save()
                    SystemLog.objects.create(
                        target_asset=self.asset,
                        action_type="IOT_CRITICAL_ALERT",
                        action=f"Asset {self.asset.tag} moved to maintenance due to critical high temperature alert."
                    )

            battery = data.get('battery')
            low_battery = self.alert_thresholds.get('low_battery')
            if battery is not None and low_battery is not None:
                if battery < low_battery:
                    self.status = self.ALERT
                    IoTAlert.objects.create(
                        iot_device=self,
                        alert_type="BATTERY_LOW",
                        severity="WARNING",
                        message=f"Low battery warning: {battery}% (Threshold: {low_battery}%)."
                    )

            self.save()

    def __str__(self):
        return f"{self.device_id} ({self.asset.name})"

class IoTAlert(models.Model):
    iot_device = models.ForeignKey(
        IoTDevice,
        on_delete=models.CASCADE,
        related_name='alerts'
    )
    alert_type = models.CharField(max_length=50)
    severity = models.CharField(
        max_length=20,
        choices=[
            ('INFO', 'Info'),
            ('WARNING', 'Warning'),
            ('CRITICAL', 'Critical'),
        ],
        default='INFO'
    )
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def resolve(self):
        self.is_resolved = True
        self.resolved_at = timezone.now()
        self.save()
