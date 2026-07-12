from django.db import models, transaction
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError, PermissionDenied
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

    ELEVATED_ROLES = {ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD}

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=EMPLOYEE)

    def promote_role(self, new_role, promoted_by):
        if promoted_by.role != self.ADMIN:
            raise PermissionDenied("Only an Admin can promote user roles.")
        if new_role not in dict(self.ROLE_CHOICES):
            raise ValidationError(f"'{new_role}' is not a valid role.")
        previous_role = self.role
        with transaction.atomic():
            self.role = new_role
            self.save(update_fields=['role'])
            SystemLog.objects.create(
                actor=promoted_by,
                action_type='ROLE_CHANGE',
                action=(
                    f"User '{self.username}' role changed from "
                    f"'{previous_role}' to '{new_role}' by '{promoted_by.username}'."
                ),
            )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Department(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children'
    )
    head = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_departments'
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
    category = models.ForeignKey(AssetCategory, on_delete=models.CASCADE, related_name='assets')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=AVAILABLE)
    location = models.CharField(max_length=200, blank=True)
    is_shared = models.BooleanField(default=False)
    acquisition_date = models.DateField(default=timezone.now)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    attributes = models.JSONField(default=dict, blank=True)

    _original_status = None # To store the original status before save

    def save(self, *args, **kwargs):
        is_new = not self.pk
        with transaction.atomic():
            if not self.tag:
                last_asset = Asset.objects.select_for_update().order_by('-id').first()
                last_id = last_asset.id if last_asset else 0
                self.tag = f"AF-{(last_id + 1):04d}"
            
            if not is_new: # Only fetch old status if it's an existing object
                self._original_status = Asset.objects.get(pk=self.pk).status

            super().save(*args, **kwargs)
            
            if not is_new and self._original_status != self.status:
                SystemLog.objects.create(
                    target_asset=self,
                    action_type='STATE_CHANGE',
                    action=(
                        f"Asset '{self.tag}' status changed "
                        f"from '{original_status}' to '{self.status}'."
                    ),
                )

    def __str__(self):
        return f"{self.name} ({self.tag})"


class AssetAllocation(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='allocations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='allocations')
    checked_out_at = models.DateTimeField(default=timezone.now)
    expected_return_date = models.DateField(null=True, blank=True)
    actual_return_date = models.DateField(null=True, blank=True)

    def clean(self):
        if not self.pk:
            locked_asset = Asset.objects.select_for_update().filter(pk=self.asset.pk).first()
            if locked_asset.status != Asset.AVAILABLE:
                active_alloc = (
                    AssetAllocation.objects
                    .select_related('user')
                    .filter(asset=locked_asset, actual_return_date__isnull=True)
                    .first()
                )
                holder_name = 'an unidentified user'
                if active_alloc:
                    full_name = active_alloc.user.get_full_name()
                    holder_name = full_name if full_name.strip() else active_alloc.user.username
                raise ValidationError(
                    f"Asset '{locked_asset.tag}' is not available for allocation. "
                    f"It is currently held by {holder_name}."
                )

    def save(self, *args, **kwargs):
        is_new = not self.pk
        with transaction.atomic():
            self.clean()
            super().save(*args, **kwargs)
            if is_new and self.actual_return_date is None:
                Asset.objects.filter(pk=self.asset.pk).update(status=Asset.ALLOCATED)
                self.asset.refresh_from_db(fields=['status'])
                SystemLog.objects.create(
                    target_asset=self.asset,
                    action_type='ALLOCATION_OPEN',
                    action=(
                        f"Asset '{self.asset.tag}' allocated to "
                        f"'{self.user.username}' on {self.checked_out_at.date()}."
                    ),
                )
            elif not is_new and self.actual_return_date is not None:
                Asset.objects.filter(pk=self.asset.pk).update(status=Asset.AVAILABLE)
                self.asset.refresh_from_db(fields=['status'])
                SystemLog.objects.create(
                    target_asset=self.asset,
                    action_type='ALLOCATION_CLOSE',
                    action=(
                        f"Asset '{self.asset.tag}' returned by "
                        f"'{self.user.username}' on {self.actual_return_date}."
                    ),
                )


class ResourceBooking(models.Model):
    resource = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_cancelled = models.BooleanField(default=False)

    def clean(self):
        if not (self.start_time and self.end_time and self.resource):
            return
        if self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time.")
        overlapping = ResourceBooking.objects.filter(
            resource=self.resource,
            is_cancelled=False,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time,
        )
        if self.pk:
            overlapping = overlapping.exclude(pk=self.pk)
        if overlapping.exists():
            raise ValidationError(
                f"This time slot overlaps with an existing active booking for '{self.resource.name}'."
            )

    def save(self, *args, **kwargs):
        with transaction.atomic():
            Asset.objects.select_for_update().filter(pk=self.resource.pk).get()
            overlapping = ResourceBooking.objects.select_for_update().filter(
                resource=self.resource,
                is_cancelled=False,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
            )
            if self.pk:
                overlapping = overlapping.exclude(pk=self.pk)
            if overlapping.exists():
                raise ValidationError(
                    f"This time slot overlaps with an existing active booking for '{self.resource.name}'."
                )
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

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='transfer_requests')
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_transfers')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_transfers')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requested_transfers')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=REQUESTED)
    created_at = models.DateTimeField(auto_now_add=True)

    def approve(self, approved_by):
        if self.status != self.REQUESTED:
            raise ValidationError("Only a pending transfer request can be approved.")
        if approved_by.role not in User.ELEVATED_ROLES:
            raise PermissionDenied("Insufficient permissions to approve transfer requests.")
        with transaction.atomic():
            active_alloc = (
                AssetAllocation.objects
                .select_for_update()
                .filter(asset=self.asset, actual_return_date__isnull=True)
                .first()
            )
            if active_alloc:
                active_alloc.actual_return_date = timezone.now().date()
                AssetAllocation.objects.filter(pk=active_alloc.pk).update(
                    actual_return_date=active_alloc.actual_return_date
                )
                SystemLog.objects.create(
                    actor=approved_by,
                    target_asset=self.asset,
                    action_type='ALLOCATION_CLOSE',
                    action=(
                        f"Allocation for asset '{self.asset.tag}' closed for "
                        f"'{self.from_user.username}' as part of transfer approval."
                    ),
                )

            Asset.objects.filter(pk=self.asset.pk).update(status=Asset.AVAILABLE)
            self.asset.refresh_from_db(fields=['status'])

            new_alloc = AssetAllocation(
                asset=self.asset,
                user=self.to_user,
                checked_out_at=timezone.now(),
            )
            new_alloc.save()

            TransferRequest.objects.filter(pk=self.pk).update(status=self.APPROVED)
            self.status = self.APPROVED

            SystemLog.objects.create(
                actor=approved_by,
                target_asset=self.asset,
                action_type='TRANSFER_APPROVAL',
                action=(
                    f"Transfer of asset '{self.asset.tag}' from "
                    f"'{self.from_user.username}' to '{self.to_user.username}' "
                    f"approved by '{approved_by.username}'."
                ),
            )

    def reject(self, rejected_by):
        if self.status != self.REQUESTED:
            raise ValidationError("Only a pending transfer request can be rejected.")
        if rejected_by.role not in User.ELEVATED_ROLES:
            raise PermissionDenied("Insufficient permissions to reject transfer requests.")
        with transaction.atomic():
            TransferRequest.objects.filter(pk=self.pk).update(status=self.REJECTED)
            self.status = self.REJECTED
            SystemLog.objects.create(
                actor=rejected_by,
                target_asset=self.asset,
                action_type='TRANSFER_REJECTION',
                action=(
                    f"Transfer of asset '{self.asset.tag}' from "
                    f"'{self.from_user.username}' to '{self.to_user.username}' "
                    f"rejected by '{rejected_by.username}'."
                ),
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

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='maintenance_requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='maintenance_requests')
    description = models.TextField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        old_status = None
        if self.pk:
            old_status = MaintenanceRequest.objects.get(pk=self.pk).status
        with transaction.atomic():
            if self.status == self.RESOLVED and self.resolved_at is None:
                self.resolved_at = timezone.now()
            super().save(*args, **kwargs)
            if self.status == self.APPROVED and old_status != self.APPROVED:
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
            elif self.status == self.RESOLVED and old_status != self.RESOLVED:
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


class AuditCycle(models.Model):
    title = models.CharField(max_length=200)
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='audit_cycles', null=True, blank=True
    )
    location = models.CharField(max_length=200, blank=True)
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    is_closed = models.BooleanField(default=False)

    def close_cycle(self, actor=None):
        if self.is_closed:
            raise ValidationError(f"Audit cycle '{self.title}' is already closed.")
        with transaction.atomic():
            missing_entries = (
                self.entries
                .select_related('asset')
                .select_for_update()
                .filter(status=AuditEntry.MISSING)
            )
            missing_assets = list(missing_entries.values_list('asset_id', 'asset__tag'))

            Asset.objects.filter(
                id__in=[a[0] for a in missing_assets]
            ).update(status=Asset.LOST)

            for asset_id, asset_tag in missing_assets:
                SystemLog.objects.create(
                    actor=actor,
                    action_type='AUDIT_LOST',
                    action=(
                        f"Asset '{asset_tag}' (ID: {asset_id}) flagged as LOST "
                        f"on closure of audit cycle '{self.title}'."
                    ),
                )

            AuditCycle.objects.filter(pk=self.pk).update(
                is_closed=True,
                end_date=timezone.now().date(),
            )
            self.is_closed = True
            self.end_date = timezone.now().date()

            SystemLog.objects.create(
                actor=actor,
                action_type='AUDIT_CYCLE_CLOSED',
                action=(
                    f"Audit cycle '{self.title}' closed. "
                    f"{len(missing_assets)} asset(s) flagged as LOST."
                ),
            )

    def __str__(self):
        return self.title


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

    cycle = models.ForeignKey(AuditCycle, on_delete=models.CASCADE, related_name='entries')
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='audit_entries')
    auditor = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_entries'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    notes = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.status == self.VERIFIED and self.verified_at is None:
            self.verified_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.cycle.title} — {self.asset.tag} ({self.status})"


class SystemLog(models.Model):
    actor = models.ForeignKey(
        User, on_delete=models.PROTECT, null=True, blank=True, related_name='system_logs'
    )
    target_asset = models.ForeignKey(
        Asset, on_delete=models.PROTECT, null=True, blank=True, related_name='system_logs'
    )
    action_type = models.CharField(max_length=100)
    action = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError("System logs are immutable and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("System logs are immutable and cannot be deleted.")

    def __str__(self):
        return f"[{self.action_type}] {self.timestamp:%Y-%m-%d %H:%M} — {self.action[:80]}"
