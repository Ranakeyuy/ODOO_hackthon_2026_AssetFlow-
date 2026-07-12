import os
import django
from django.utils import timezone
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'assetflow.settings')
django.setup()

from core.models import User, Department, AssetCategory, Asset, AssetAllocation, ResourceBooking, TransferRequest, MaintenanceRequest

def seed_db():
    print("Seeding database...")
    
    # 1. Create Users
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
            print(f"Created user {user.username} with role {user.role}")
        user_map[ud["id"]] = user

    # 2. Create Departments
    depts_data = [
        {"id": 1, "name": "Engineering", "parentId": None, "headId": 3},
        {"id": 2, "name": "QA", "parentId": 1, "headId": None},
        {"id": 3, "name": "Finance", "parentId": None, "headId": None}
    ]
    
    dept_map = {}
    # First pass: create departments without parents/heads to avoid FK issues
    for dd in depts_data:
        dept, created = Department.objects.get_or_create(
            name=dd["name"],
            defaults={}
        )
        dept_map[dd["id"]] = dept
        
    # Second pass: set parents and heads
    for dd in depts_data:
        dept = dept_map[dd["id"]]
        if dd["parentId"]:
            dept.parent = dept_map[dd["parentId"]]
        if dd["headId"]:
            dept.head = user_map[dd["headId"]]
        dept.save()
        print(f"Configured department {dept.name}")

    # 3. Create Categories
    cats_data = [
        {"id": 1, "name": "Laptops", "description": "Company issued laptops", "schema": {"ram": "string", "storage": "string"}},
        {"id": 2, "name": "Servers", "description": "Rack mounted servers", "schema": {"cores": "number", "memory": "string"}},
        {"id": 3, "name": "Conference Rooms", "description": "Meeting rooms", "schema": {"capacity": "number"}}
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
        print(f"Configured category {cat.name}")

    # 4. Create Assets
    assets_data = [
        {"id": 1, "tag": "LAP-001", "name": "MacBook Pro 16", "serial_number": "C02DF124MD6M", "categoryId": 1, "status": "ALLOCATED", "location": "HQ-Floor 3", "is_shared": False, "attributes": {"ram": "32GB", "storage": "1TB SSD"}},
        {"id": 2, "tag": "LAP-002", "name": "ThinkPad T14", "serial_number": "PF24B6G1", "categoryId": 1, "status": "AVAILABLE", "location": "HQ-Floor 3", "is_shared": False, "attributes": {"ram": "16GB", "storage": "512GB SSD"}},
        {"id": 3, "tag": "SRV-001", "name": "Dell PowerEdge R750", "serial_number": "DELL8362", "categoryId": 2, "status": "AVAILABLE", "location": "Server Room B", "is_shared": True, "attributes": {"cores": 32, "memory": "128GB"}},
        {"id": 4, "tag": "RM-101", "name": "Boardroom Alpha", "serial_number": "N/A", "categoryId": 3, "status": "AVAILABLE", "location": "HQ-Floor 1", "is_shared": True, "attributes": {"capacity": 15}},
        {"id": 5, "tag": "LAP-003", "name": "MacBook Air M2", "serial_number": "C02KF981MD6N", "categoryId": 1, "status": "UNDER_MAINTENANCE", "location": "IT Desk", "is_shared": False, "attributes": {"ram": "8GB", "storage": "256GB SSD"}},
        {"id": 6, "tag": "LAP-004", "name": "Dell Latitude 5430", "serial_number": "DEL49281", "categoryId": 1, "status": "ALLOCATED", "location": "HQ-Floor 2", "is_shared": False, "attributes": {"ram": "16GB", "storage": "512GB SSD"}}
    ]
    
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
            # Force update status as Django signals or saves might have overridden it
            asset.status = ad["status"]
            asset.save()
        asset_map[ad["id"]] = asset
        print(f"Configured asset {asset.name} ({asset.tag})")

    # 5. Create Allocations
    allocations_data = [
        {"id": 1, "assetId": 1, "userId": 4, "checkedOutAt": "2026-07-01T09:00:00Z", "expectedReturnDate": "2026-07-10", "actualReturnDate": None},
        {"id": 2, "assetId": 6, "userId": 5, "checkedOutAt": "2026-07-05T10:00:00Z", "expectedReturnDate": "2026-07-25", "actualReturnDate": None}
    ]
    
    for ald in allocations_data:
        checked_out = datetime.fromisoformat(ald["checkedOutAt"].replace('Z', '+00:00'))
        expected = datetime.strptime(ald["expectedReturnDate"], "%Y-%m-%d").date() if ald["expectedReturnDate"] else None
        
        alloc, created = AssetAllocation.objects.get_or_create(
            id=ald["id"],
            defaults={
                "asset": asset_map[ald["assetId"]],
                "user": user_map[ald["userId"]],
                "checked_out_at": checked_out,
                "expected_return_date": expected,
                "actual_return_date": None
            }
        )
        print(f"Configured allocation for {alloc.asset.name}")

    # 6. Create Bookings
    bookings_data = [
        {"id": 1, "resourceId": 4, "userId": 3, "startTime": "2026-07-12T10:00:00", "endTime": "2026-07-12T12:00:00"},
        {"id": 2, "resourceId": 3, "userId": 4, "startTime": "2026-07-12T14:00:00", "endTime": "2026-07-12T17:00:00"}
    ]
    for bd in bookings_data:
        start = datetime.fromisoformat(bd["startTime"])
        end = datetime.fromisoformat(bd["endTime"])
        booking, created = ResourceBooking.objects.get_or_create(
            id=bd["id"], # This is the lookup field
            defaults={ # This was missing and caused the SyntaxError
                "resource": asset_map[bd["resourceId"]],
                "user": user_map[bd["userId"]],
                "start_time": timezone.make_aware(start),
                "end_time": timezone.make_aware(end)
            }
        )
        print(f"Configured booking for {booking.resource.name}")

    # 7. Create Transfers
    transfers_data = [
        {"id": 1, "assetId": 1, "fromUserId": 4, "toUserId": 5, "requestedById": 4, "status": "PENDING", "createdAt": "2026-07-11T16:00:00Z"}
    ]
    for td in transfers_data:
        created_at = datetime.fromisoformat(td["createdAt"].replace('Z', '+00:00'))
        transfer, created = TransferRequest.objects.get_or_create(
            id=td["id"], # This is the lookup field
            defaults={ # This was missing and caused the SyntaxError
                "asset": asset_map[td["assetId"]],
                "from_user": user_map[td["fromUserId"]],
                "to_user": user_map[td["toUserId"]],
                "requested_by": user_map[td["requestedById"]],
                "status": TransferRequest.REQUESTED if td["status"] == "PENDING" else td["status"],
                "created_at": created_at
            }
        )
        print(f"Configured transfer for {transfer.asset.name}")

    # 8. Create Maintenance Requests
    maintenance_data = [
        {"id": 1, "assetId": 5, "requestedById": 2, "description": "Battery replacement required", "status": "APPROVED", "createdAt": "2026-07-11T09:30:00Z"}
    ]
    for md in maintenance_data:
        created_at = datetime.fromisoformat(md["createdAt"].replace('Z', '+00:00'))
        maint, created = MaintenanceRequest.objects.get_or_create(
            id=md["id"], # This is the lookup field
            defaults={ # This was missing and caused the SyntaxError
                "asset": asset_map[md["assetId"]],
                "requested_by": user_map[md["requestedById"]],
                "description": md["description"],
                "status": md["status"],
                "created_at": created_at
            }
        )
        # Ensure status is approved and correct
        if not created:
            maint.status = md["status"]
            maint.save()
        print(f"Configured maintenance for {maint.asset.name}")

    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_db()
