from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from core.models import User, Department, AssetCategory, Asset, AssetAllocation, ResourceBooking, TransferRequest, MaintenanceRequest, AuditCycle, AuditEntry, IoTDevice, IoTAlert

class AssetFlowModelTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@company.com',
            password='password123',
            role=User.ADMIN
        )
        self.emp1 = User.objects.create_user(
            username='emp1',
            email='emp1@company.com',
            password='password123',
            role=User.EMPLOYEE
        )
        self.emp2 = User.objects.create_user(
            username='emp2',
            email='emp2@company.com',
            password='password123',
            role=User.EMPLOYEE
        )
        self.category = AssetCategory.objects.create(
            name='Laptops',
            description='Corporate issued laptops',
            schema={'ram': 'string', 'storage': 'string'}
        )
        self.asset = Asset.objects.create(
            name='MacBook Pro',
            serial_number='12345',
            category=self.category,
            status=Asset.AVAILABLE
        )

    def test_user_default_role(self):
        user = User.objects.create_user(
            username='test_user',
            password='password123'
        )
        self.assertEqual(user.role, User.EMPLOYEE)

    def test_asset_tag_generation(self):
        self.assertTrue(self.asset.tag.startswith('AF-'))

    def test_asset_allocation_success(self):
        allocation = AssetAllocation.objects.create(
            asset=self.asset,
            user=self.emp1,
            expected_return_date=timezone.now().date() + timedelta(days=5)
        )
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, Asset.ALLOCATED)

    def test_asset_allocation_validation_overlap(self):
        AssetAllocation.objects.create(
            asset=self.asset,
            user=self.emp1,
            expected_return_date=timezone.now().date() + timedelta(days=5)
        )
        self.asset.refresh_from_db()
        duplicate_alloc = AssetAllocation(
            asset=self.asset,
            user=self.emp2,
            expected_return_date=timezone.now().date() + timedelta(days=2)
        )
        with self.assertRaises(ValidationError):
            duplicate_alloc.clean()

    def test_resource_booking_overlap(self):
        now = timezone.now()
        ResourceBooking.objects.create(
            resource=self.asset,
            user=self.emp1,
            start_time=now,
            end_time=now + timedelta(hours=2)
        )
        overlapping = ResourceBooking(
            resource=self.asset,
            user=self.emp2,
            start_time=now + timedelta(hours=1),
            end_time=now + timedelta(hours=3)
        )
        with self.assertRaises(ValidationError):
            overlapping.clean()

    def test_transfer_request_workflow(self):
        AssetAllocation.objects.create(
            asset=self.asset,
            user=self.emp1
        )
        self.asset.refresh_from_db()
        transfer = TransferRequest.objects.create(
            asset=self.asset,
            from_user=self.emp1,
            to_user=self.emp2,
            requested_by=self.emp1
        )
        transfer.approve(approved_by=self.admin)
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, Asset.ALLOCATED)
        active_alloc = AssetAllocation.objects.filter(asset=self.asset, actual_return_date__isnull=True).first()
        self.assertEqual(active_alloc.user, self.emp2)

    def test_maintenance_request_workflow(self):
        maint = MaintenanceRequest.objects.create(
            asset=self.asset,
            requested_by=self.emp1,
            description='Screen broken'
        )
        maint.status = MaintenanceRequest.APPROVED
        maint.save()
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, Asset.UNDER_MAINTENANCE)
        maint.status = MaintenanceRequest.RESOLVED
        maint.save()
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, Asset.AVAILABLE)

    def test_audit_cycle_auto_lost_flag(self):
        cycle = AuditCycle.objects.create(
            title='Annual Audit Q3',
            start_date=timezone.now().date()
        )
        entry = AuditEntry.objects.create(
            cycle=cycle,
            asset=self.asset,
            status=AuditEntry.MISSING
        )
        cycle.close_cycle(actor=self.admin)
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, Asset.LOST)

    def test_iot_telemetry_heartbeat(self):
        device = IoTDevice.objects.create(
            asset=self.asset,
            device_id="SEN-TEST-001",
            status=IoTDevice.OFFLINE,
            alert_thresholds={"max_temperature": 50.0}
        )
        device.record_telemetry({"temperature": 25.0})
        self.assertEqual(device.status, IoTDevice.ONLINE)
        self.assertIsNotNone(device.last_heartbeat)

    def test_iot_alert_trigger(self):
        device = IoTDevice.objects.create(
            asset=self.asset,
            device_id="SEN-TEST-002",
            status=IoTDevice.OFFLINE,
            alert_thresholds={"max_temperature": 50.0}
        )
        device.record_telemetry({"temperature": 55.0})
        self.assertEqual(device.status, IoTDevice.ALERT)
        self.assertTrue(IoTAlert.objects.filter(iot_device=device, alert_type="TEMPERATURE_HIGH").exists())

    def test_iot_critical_asset_maintenance_trigger(self):
        device = IoTDevice.objects.create(
            asset=self.asset,
            device_id="SEN-TEST-003",
            status=IoTDevice.OFFLINE,
            alert_thresholds={"max_temperature": 50.0}
        )
        device.record_telemetry({"temperature": 55.0})
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, Asset.UNDER_MAINTENANCE)
