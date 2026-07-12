import os
import django
from django.utils import timezone
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'assetflow.settings')
django.setup()

from core.models import User, Department, AssetCategory, Asset, AssetAllocation, ResourceBooking, TransferRequest, MaintenanceRequest, IoTDevice, IoTAlert

def seed_db():
    users_data = [
        {"id": 1, "username": "admin", "name": "Keyur Rana", "role": "ADMIN", "email": "ranakeyur38@gmail.com", "is_superuser": True, "is_staff": True},
        {"id": 2, "username": "jdoe", "name": "John Doe", "role": "ASSET_MANAGER", "email": "john@example.com", "is_superuser": False, "is_staff": True},
        {"id": 3, "username": "asmith", "name": "Alice Smith", "role": "DEPARTMENT_HEAD", "email": "alice@example.com", "is_superuser": False, "is_staff": False},
        {"id": 4, "username": "bjones", "name": "Bob Jones", "role": "EMPLOYEE", "email": "bob@example.com", "is_superuser": False, "is_staff": False},
        {"id": 5, "username": "cwhite", "name": "Charlie White", "role": "EMPLOYEE", "email": "charlie@example.com", "is_superuser": False, "is_staff": False}
    ]
    
    user_map = {}
    for ud in users_data:
        user, created = User.objects.get_or_create(
            username=ud["username"],
            defaults={
                "email": ud["email"],
                "role": ud["role"],
                "is_superuser": ud["is_superuser"],
                "is_staff": ud["is_staff"],
                "first_name": ud["name"].split()[0],
                "last_name": ud["name"].split()[1] if len(ud["name"].split()) > 1 else ""
            }
        )
        if created:
            user.set_password("password123")
            user.save()
        user_map[ud["id"]] = user

    depts_data = [
        {"id": 1, "name": "Engineering", "parentId": None, "headId": 3},
        {"id": 2, "name": "QA", "parentId": 1, "headId": None},
        {"id": 3, "name": "Finance", "parentId": None, "headId": None}
    ]
    
    dept_map = {}
    for dd in depts_data:
        dept, created = Department.objects.get_or_create(
            name=dd["name"],
            defaults={} # Removed explicit ID assignment
        )
        dept_map[dd["id"]] = dept
        
    for dd in depts_data:
        dept = dept_map[dd["id"]]
        if dd["parentId"]:
            dept.parent = dept_map[dd["parentId"]]
        if dd["headId"]:
            dept.head = user_map[dd["headId"]]
        dept.save()

    cats_data = [
        {"id": 1, "name": "Laptops", "description": "Company issued laptops", "schema": {"ram": "string", "storage": "string"}},
        {"id": 2, "name": "Servers", "description": "Rack mounted servers", "schema": {"cores": "number", "memory": "string"}},
        {"id": 3, "name": "Conference Rooms", "description": "Meeting rooms", "schema": {"capacity": "number"}},
        {"id": 4, "name": "Networking", "description": "Routers and switches", "schema": {"ports": "number"}},
        {"id": 5, "name": "Furniture", "description": "Office desks and chairs", "schema": {"type": "string"}}
    ]
    
    cat_map = {}
    for cd in cats_data:
        cat, created = AssetCategory.objects.get_or_create(
            name=cd["name"],
            defaults={
                "description": cd["description"],
                "schema": cd["schema"]
            }
        )
        cat_map[cd["id"]] = cat

    assets_data = [
        {"id": 1, "tag": "LAP-001", "name": "MacBook Pro 16", "serial_number": "C02DF124MD6M", "categoryId": 1, "status": "ALLOCATED", "location": "HQ-Floor 3", "is_shared": False, "attributes": {"ram": "32GB", "storage": "1TB SSD"}},
        {"id": 2, "tag": "LAP-002", "name": "ThinkPad T14", "serial_number": "PF24B6G1", "categoryId": 1, "status": "AVAILABLE", "location": "HQ-Floor 3", "is_shared": False, "attributes": {"ram": "16GB", "storage": "512GB SSD"}},
        {"id": 3, "tag": "SRV-001", "name": "Dell PowerEdge R750", "serial_number": "DELL8362", "categoryId": 2, "status": "AVAILABLE", "location": "Server Room B", "is_shared": True, "attributes": {"cores": 32, "memory": "128GB"}},
        {"id": 4, "tag": "RM-101", "name": "Boardroom Alpha", "serial_number": "N/A", "categoryId": 3, "status": "AVAILABLE", "location": "HQ-Floor 1", "is_shared": True, "attributes": {"capacity": 15}},
        {"id": 5, "tag": "LAP-003", "name": "MacBook Air M2", "serial_number": "C02KF981MD6N", "categoryId": 1, "status": "UNDER_MAINTENANCE", "location": "IT Desk", "is_shared": False, "attributes": {"ram": "8GB", "storage": "256GB SSD"}},
        {"id": 6, "tag": "LAP-004", "name": "Dell Latitude 5430", "serial_number": "DEL49281", "categoryId": 1, "status": "ALLOCATED", "location": "HQ-Floor 2", "is_shared": False, "attributes": {"ram": "16GB", "storage": "512GB SSD"}},
        {"id": 7, "tag": "RTR-001", "name": "Cisco ISR 4331", "serial_number": "CISCO48291", "categoryId": 4, "status": "AVAILABLE", "location": "Server Room B", "is_shared": True, "attributes": {"ports": 8}},
        {"id": 8, "tag": "SW-001", "name": "Ubiquiti UniFi 24-Port", "serial_number": "UBI92810", "categoryId": 4, "status": "AVAILABLE", "location": "Switch Closet A", "is_shared": True, "attributes": {"ports": 24}},
        {"id": 9, "tag": "CHR-001", "name": "Herman Miller Aeron", "serial_number": "HM829101", "categoryId": 5, "status": "AVAILABLE", "location": "Office 3A", "is_shared": False, "attributes": {"type": "Ergonomic Chair"}},
        {"id": 10, "tag": "DSK-001", "name": "Standing Desk Pro", "serial_number": "DK92819", "categoryId": 5, "status": "AVAILABLE", "location": "Office 3B", "is_shared": False, "attributes": {"type": "Standing Desk"}},
        {"id": 11, "tag": "SRV-002", "name": "HP ProLiant DL360", "serial_number": "HP938210", "categoryId": 2, "status": "AVAILABLE", "location": "Server Room B", "is_shared": True, "attributes": {"cores": 16, "memory": "64GB"}},
        {"id": 12, "tag": "PRJ-001", "name": "Epson Smart Projector", "serial_number": "EPS92810", "categoryId": 3, "status": "AVAILABLE", "location": "Boardroom Alpha", "is_shared": True, "attributes": {"capacity": 2000}}
    ]
    
    statuses = [Asset.AVAILABLE, Asset.ALLOCATED, Asset.RESERVED, Asset.UNDER_MAINTENANCE, Asset.LOST, Asset.RETIRED, Asset.DISPOSED]
    categories_list = [
        {"cat_id": 1, "prefix": "LAP", "names": ["MacBook Pro 14", "ThinkPad X1 Carbon", "HP EliteBook 830", "Dell XPS 13", "Lenovo Yoga 9i"]},
        {"cat_id": 2, "prefix": "SRV", "names": ["Dell PowerEdge R640", "Cisco UCS C240", "Supermicro FatTwin", "HP ProLiant DL380"]},
        {"cat_id": 3, "prefix": "RM", "names": ["Meeting Room 101", "Huddle Room 202", "Focus Room 104", "Training Room C"]},
        {"cat_id": 4, "prefix": "NET", "names": ["Aruba Access Point 303", "Palo Alto PA-3220", "Fortinet FortiGate 60F", "Cisco Catalyst 9300"]},
        {"cat_id": 5, "prefix": "FURN", "names": ["Steelcase Gesture Chair", "Task Chair Basic", "Whiteboard Mobile", "Executive Desk Oak"]}
    ]
    
    for i in range(13, 60):
        cat_info = categories_list[(i % len(categories_list))]
        cat_id = cat_info["cat_id"]
        prefix = cat_info["prefix"]
        name_template = cat_info["names"][(i % len(cat_info["names"]))]
        name = f"{name_template} #{i}"
        tag = f"{prefix}-{i:03d}"
        serial = f"SN-{cat_id}{prefix}{i:05d}"
        status = statuses[(i % len(statuses))]
        location = f"Floor {((i % 4) + 1)} - Zone {chr(65 + (i % 3))}"
        is_shared = (cat_id in [3, 4])
        
        attrs = {}
        if cat_id == 1:
            attrs = {"ram": "16GB", "storage": "512GB SSD"}
        elif cat_id == 2:
            attrs = {"cores": 16, "memory": "64GB"}
        elif cat_id == 3:
            attrs = {"capacity": 8}
        elif cat_id == 4:
            attrs = {"ports": 12}
        elif cat_id == 5:
            attrs = {"type": "Office Fixture"}
            
        assets_data.append({
            "id": i,
            "tag": tag,
            "name": name,
            "serial_number": serial,
            "categoryId": cat_id,
            "status": status,
            "location": location,
            "is_shared": is_shared,
            "attributes": attrs
        })
        
    asset_map = {}
    for ad in assets_data:
        asset, created = Asset.objects.get_or_create(
            tag=ad["tag"],
            defaults={
                "name": ad["name"],
                "serial_number": ad["serial_number"],
                "category": cat_map[ad["categoryId"]],
                "status": ad["status"],
                "location": ad["location"],
                "is_shared": ad["is_shared"],
                "attributes": ad["attributes"]
            }
        )
        if not created:
            asset.status = ad["status"]
            asset.save()
        asset_map[ad["id"]] = asset

    allocations_data = [
        {"id": 1, "assetId": 1, "userId": 4, "checkedOutAt": "2026-07-01T09:00:00Z", "expectedReturnDate": "2026-07-10", "actualReturnDate": None},
        {"id": 2, "assetId": 6, "userId": 5, "checkedOutAt": "2026-07-05T10:00:00Z", "expectedReturnDate": "2026-07-25", "actualReturnDate": None}
    ]
    
    alloc_id = 3
    for ad in assets_data:
        if ad["status"] == "ALLOCATED" and ad["id"] not in [1, 6]:
            user_id = (ad["id"] % 3) + 3
            allocations_data.append({
                "id": alloc_id,
                "assetId": ad["id"],
                "userId": user_id,
                "checkedOutAt": "2026-07-10T09:00:00Z",
                "expectedReturnDate": "2026-07-30",
                "actualReturnDate": None
            })
            alloc_id += 1
            
    for ald in allocations_data:
        checked_out = datetime.fromisoformat(ald["checkedOutAt"].replace('Z', '+00:00'))
        expected = datetime.strptime(ald["expectedReturnDate"], "%Y-%m-%d").date() if ald["expectedReturnDate"] else None
        
        AssetAllocation.objects.get_or_create(
            asset=asset_map[ald["assetId"]],
            user=user_map[ald["userId"]],
            checked_out_at=checked_out,
            defaults={
                "expected_return_date": expected,
                "actual_return_date": None
            }
        )

    bookings_data = [
        {"id": 1, "resourceId": 4, "userId": 3, "startTime": "2026-07-12T10:00:00", "endTime": "2026-07-12T12:00:00"},
        {"id": 2, "resourceId": 3, "userId": 4, "startTime": "2026-07-12T14:00:00", "endTime": "2026-07-12T17:00:00"}
    ]
    for bd in bookings_data:
        start = datetime.fromisoformat(bd["startTime"])
        end = datetime.fromisoformat(bd["endTime"])
        ResourceBooking.objects.get_or_create(
            resource=asset_map[bd["resourceId"]],
            user=user_map[bd["userId"]],
            start_time=timezone.make_aware(start),
            end_time=timezone.make_aware(end)
        )

    transfers_data = [
        {"id": 1, "assetId": 1, "fromUserId": 4, "toUserId": 5, "requestedById": 4, "status": "PENDING", "createdAt": "2026-07-11T16:00:00Z"}
    ]
    for td in transfers_data:
        created_at = datetime.fromisoformat(td["createdAt"].replace('Z', '+00:00'))
        TransferRequest.objects.get_or_create(
            asset=asset_map[td["assetId"]],
            from_user=user_map[td["fromUserId"]],
            to_user=user_map[td["toUserId"]],
            requested_by=user_map[td["requestedById"]],
            created_at=created_at,
            defaults={
                "status": TransferRequest.REQUESTED if td["status"] == "PENDING" else td["status"]
            }
        )

    maintenance_data = [
        {"id": 1, "assetId": 5, "requestedById": 2, "description": "Battery replacement required", "status": "APPROVED", "createdAt": "2026-07-11T09:30:00Z"}
    ]
    for md in maintenance_data:
        created_at = datetime.fromisoformat(md["createdAt"].replace('Z', '+00:00'))
        maint, created = MaintenanceRequest.objects.get_or_create(
            asset=asset_map[md["assetId"]],
            requested_by=user_map[md["requestedById"]],
            description=md["description"],
            created_at=created_at,
            defaults={
                "status": md["status"]
            }
        )
        if not created:
            maint.status = md["status"]
            maint.save()

    iot_devices_data = [
        {"assetId": 3, "deviceId": "SEN-SRV-001", "status": "ONLINE", "alertThresholds": {"max_temperature": 75.0, "low_battery": 15.0}},
        {"assetId": 8, "deviceId": "SEN-SW-001", "status": "ONLINE", "alertThresholds": {"max_temperature": 60.0}},
        {"assetId": 7, "deviceId": "SEN-RTR-001", "status": "ONLINE", "alertThresholds": {"max_temperature": 65.0}},
        {"assetId": 11, "deviceId": "SEN-SRV-002", "status": "ONLINE", "alertThresholds": {"max_temperature": 80.0}}
    ]
    for iod in iot_devices_data:
        IoTDevice.objects.get_or_create(
            device_id=iod["deviceId"],
            defaults={
                "asset": asset_map[iod["assetId"]],
                "status": iod["status"],
                "alert_thresholds": iod["alertThresholds"]
            }
        )

if __name__ == "__main__":
    seed_db()
