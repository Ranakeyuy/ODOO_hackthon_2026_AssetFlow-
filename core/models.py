from django.db import models
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
    
    tag = models.CharField(max_length=50, unique=True)
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

    @property
    def current_holder(self):
        alloc = self.allocations.filter(actual_return_date__isnull=True).first()
        return alloc.user.get_full_name() or alloc.user.username if alloc else "None"

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
        if not self.pk and self.asset.status != Asset.AVAILABLE:
            active_alloc = AssetAllocation.objects.filter(
                asset=self.asset,
                actual_return_date__isnull=True
            ).first()
            holder_name = (
                active_alloc.user.get_full_name() or active_alloc.user.username
                if active_alloc else "Unknown"
            )
            raise ValidationError(
                f"Asset is not available. Currently held by {holder_name}."
            )

    def save(self, *args, **kwargs):
        self.clean()
        is_new = not self.pk
        super().save(*args, **kwargs)
        if is_new and self.actual_return_date is None:
            self.asset.status = Asset.ALLOCATED
            self.asset.save()
        elif self.actual_return_date is not None:
            self.asset.status = Asset.AVAILABLE
            self.asset.save()

    @property
    def current_holder_name(self):
        return self.user.get_full_name() or self.user.username

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

    def clean(self):
        if self.start_time and self.end_time:
            if self.start_time >= self.end_time:
                raise ValidationError("Start time must be before end time.")
            overlapping = ResourceBooking.objects.filter(
                resource=self.resource,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            )
            if self.pk:
                overlapping = overlapping.exclude(pk=self.pk)
            if overlapping.exists():
                raise ValidationError("This time slot overlaps with an existing booking.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

class TransferRequest(models.Model):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
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
        default=PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def approve(self):
        if self.status == self.PENDING:
            active_alloc = AssetAllocation.objects.filter(
                asset=self.asset,
                user=self.from_user,
                actual_return_date__isnull=True
            ).first()
            if active_alloc:
                active_alloc.actual_return_date = timezone.now().date()
                active_alloc.save()
            AssetAllocation.objects.create(
                asset=self.asset,
                user=self.to_user,
                checked_out_at=timezone.now()
            )
            self.status = self.APPROVED
            self.save()

class MaintenanceRequest(models.Model):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    RESOLVED = 'RESOLVED'
    REJECTED = 'REJECTED'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (RESOLVED, 'Resolved'),
        (REJECTED, 'Rejected'),
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
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def approve(self):
        if self.status == self.PENDING:
            self.status = self.APPROVED
            self.asset.status = Asset.UNDER_MAINTENANCE
            self.asset.save()
            self.save()

    def resolve(self):
        if self.status == self.APPROVED:
            self.status = self.RESOLVED
            self.asset.status = Asset.AVAILABLE
            self.asset.save()
            self.save()

class AuditCycle(models.Model):
    OPEN = 'OPEN'
    CLOSED = 'CLOSED'
    
    STATUS_CHOICES = [
        (OPEN, 'Open'),
        (CLOSED, 'Closed'),
    ]
    
    title = models.CharField(max_length=200)
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    auditor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='audit_cycles'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=OPEN
    )

    def close_cycle(self):
        if self.status == self.OPEN:
            self.status = self.CLOSED
            self.end_date = timezone.now().date()
            self.save()
            unverified_entries = self.entries.filter(verified=False)
            for entry in unverified_entries:
                entry.asset.status = Asset.LOST
                entry.asset.save()

class AuditEntry(models.Model):
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
    verified = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
