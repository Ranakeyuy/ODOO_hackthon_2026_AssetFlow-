from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from core.models import User, Department, AssetCategory, Asset, AssetAllocation, ResourceBooking, TransferRequest, MaintenanceRequest, AuditCycle, AuditEntry, IoTDevice, IoTAlert, SystemLog

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

    def test_iot_dashboard_view(self):
        self.client.login(username='emp1', password='password123')
        response = self.client.get('/iot/')
        self.assertEqual(response.status_code, 200)

    def test_resolve_iot_alert_view(self):
        device = IoTDevice.objects.create(
            asset=self.asset,
            device_id="SEN-TEST-ALERT",
            status=IoTDevice.ONLINE,
            alert_thresholds={"max_temperature": 50.0}
        )
        device.record_telemetry({"temperature": 60.0})
        self.assertEqual(device.status, IoTDevice.ALERT)
        alert = IoTAlert.objects.filter(iot_device=device, is_resolved=False).first()
        self.assertIsNotNone(alert)
        
        self.client.login(username='admin', password='password123')
        response = self.client.post(f'/iot/alert/{alert.pk}/resolve/')
        self.assertEqual(response.status_code, 302)
        
        alert.refresh_from_db()
        device.refresh_from_db()
        self.assertTrue(alert.is_resolved)
        self.assertEqual(device.status, IoTDevice.ONLINE)

    def test_system_logs_view_restricted(self):
        self.client.login(username='emp1', password='password123')
        response = self.client.get('/logs/')
        self.assertEqual(response.status_code, 403)

    def test_system_logs_view_admin(self):
        self.client.login(username='admin', password='password123')
        SystemLog.objects.create(
            actor=self.admin,
            target_asset=self.asset,
            target_asset_tag=self.asset.tag,
            action_type="TEST_ACTION",
            action="Admin performed a test action"
        )
        
        response = self.client.get('/logs/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Admin performed a test action")
        
        response_filtered = self.client.get('/logs/?action_type=OTHER_ACTION')
        self.assertNotContains(response_filtered, "Admin performed a test action")

    def test_asset_directory_search_attributes_and_iot_device(self):
        category = AssetCategory.objects.create(
            name='Test IoT Devices',
            description='Test category',
            schema={'voltage': 'string'}
        )
        asset1 = Asset.objects.create(
            name='Smart Sensor Node X',
            serial_number='54321',
            category=category,
            status=Asset.AVAILABLE,
            attributes={'voltage': '9V'}
        )
        device = IoTDevice.objects.create(
            asset=asset1,
            device_id="SEN-TEST-SEARCH-NODE",
            status=IoTDevice.ONLINE,
            alert_thresholds={}
        )
        
        self.client.login(username='emp1', password='password123')
        
        response = self.client.get('/assets/?q=9V')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Smart Sensor Node X')
        
        response2 = self.client.get('/assets/?q=SEN-TEST-SEARCH-NODE')
        self.assertEqual(response2.status_code, 200)
        self.assertContains(response2, 'Smart Sensor Node X')
