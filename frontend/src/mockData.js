export const INITIAL_USERS = [
  { id: 1, username: "admin", name: "Keyur Rana", role: "ADMIN", email: "ranakeyur38@gmail.com", departmentId: 1 },
  { id: 2, username: "jdoe", name: "John Doe", role: "ASSET_MANAGER", email: "john@example.com", departmentId: 1 },
  { id: 3, username: "asmith", name: "Alice Smith", role: "DEPARTMENT_HEAD", email: "alice@example.com", departmentId: 2 },
  { id: 4, username: "bjones", name: "Bob Jones", role: "EMPLOYEE", email: "bob@example.com", departmentId: 2 },
  { id: 5, username: "cwhite", name: "Charlie White", role: "EMPLOYEE", email: "charlie@example.com", departmentId: 3 }
];

export const INITIAL_DEPARTMENTS = [
  { id: 1, name: "Engineering", parentId: null, headId: 3, isActive: true },
  { id: 2, name: "Quality Assurance", parentId: 1, headId: 4, isActive: true },
  { id: 3, name: "Finance", parentId: null, headId: null, isActive: true }
];

export const INITIAL_CATEGORIES = [
  { id: 1, name: "Electronics", description: "Hardware and computers", schema: { warrantyYears: "number", manufacturer: "string" } },
  { id: 2, name: "Furniture", description: "Desks, chairs, and tables", schema: { material: "string" } },
  { id: 3, name: "Vehicles", description: "Fleet and delivery vans", schema: { licensePlate: "string", engineType: "string" } }
];

export const INITIAL_ASSETS = [
  { id: 1, tag: "AF-0001", name: "MacBook Pro 16", serialNumber: "C02DF124MD6M", categoryId: 1, status: "ALLOCATED", location: "HQ-Floor 3", is_shared: false, acquisitionDate: "2026-01-10", cost: 2499, condition: "Excellent", attributes: { warrantyYears: 3, manufacturer: "Apple" } },
  { id: 2, tag: "AF-0002", name: "ThinkPad T14", serialNumber: "PF24B6G1", categoryId: 1, status: "AVAILABLE", location: "HQ-Floor 3", is_shared: false, acquisitionDate: "2026-02-15", cost: 1299, condition: "Good", attributes: { warrantyYears: 2, manufacturer: "Lenovo" } },
  { id: 3, tag: "AF-0003", name: "Dell PowerEdge R750", serialNumber: "DELL8362", categoryId: 1, status: "AVAILABLE", location: "Server Room B", is_shared: true, acquisitionDate: "2025-11-20", cost: 7499, condition: "Excellent", attributes: { warrantyYears: 5, manufacturer: "Dell" } },
  { id: 4, tag: "AF-0004", name: "Executive Desk", serialNumber: "FN-893", categoryId: 2, status: "AVAILABLE", location: "HQ-Floor 2", is_shared: false, acquisitionDate: "2026-03-01", cost: 450, condition: "Good", attributes: { material: "Mahogany" } },
  { id: 5, tag: "AF-0005", name: "Ford Transit Van", serialNumber: "VH-7721", categoryId: 3, status: "AVAILABLE", location: "Garage Plot A", is_shared: true, acquisitionDate: "2025-06-15", cost: 32000, condition: "Fair", attributes: { licensePlate: "GJ-01-XX-9921", engineType: "Diesel" } },
  { id: 6, tag: "AF-0006", name: "Ergonomic Office Chair", serialNumber: "FN-991", categoryId: 2, status: "ALLOCATED", location: "HQ-Floor 2", is_shared: false, acquisitionDate: "2026-03-05", cost: 299, condition: "Good", attributes: { material: "Mesh/Fabric" } }
];

export const INITIAL_ALLOCATIONS = [
  { id: 1, assetId: 1, userId: 4, checkedOutAt: "2026-07-01T09:00:00Z", expectedReturnDate: "2026-07-10", actualReturnDate: null },
  { id: 2, assetId: 6, userId: 5, checkedOutAt: "2026-07-05T10:00:00Z", expectedReturnDate: "2026-07-25", actualReturnDate: null }
];

export const INITIAL_BOOKINGS = [
  { id: 1, resourceId: 5, userId: 3, startTime: "2026-07-12T10:00:00", endTime: "2026-07-12T12:00:00", is_cancelled: false },
  { id: 2, resourceId: 3, userId: 4, startTime: "2026-07-12T14:00:00", endTime: "2026-07-12T17:00:00", is_cancelled: false }
];

export const INITIAL_TRANSFERS = [
  { id: 1, assetId: 1, fromUserId: 4, toUserId: 5, requestedById: 4, status: "REQUESTED", createdAt: "2026-07-11T16:00:00Z" }
];

export const INITIAL_MAINTENANCE = [
  { id: 1, assetId: 2, requestedById: 4, description: "Laptop screen flickering on startup", status: "PENDING", createdAt: "2026-07-11T09:30:00Z", priority: "Medium" }
];

export const INITIAL_AUDIT_CYCLES = [
  { id: 1, title: "Q3 Electronics Audit", location: "HQ-Floor 3", startDate: "2026-07-01", endDate: "2026-07-15", isClosed: false, auditorId: 2 }
];

export const INITIAL_AUDIT_ENTRIES = [
  { id: 1, cycleId: 1, assetId: 1, status: "VERIFIED", notes: "Verified in user possession" },
  { id: 2, cycleId: 1, assetId: 2, status: "PENDING", notes: "" },
  { id: 3, cycleId: 1, assetId: 3, status: "MISSING", notes: "Server rack slot empty" }
];

export const INITIAL_SYSTEM_LOGS = [
  { id: 1, timestamp: "2026-07-11T09:30:00Z", username: "bjones", targetTag: "AF-0002", actionType: "MAINTENANCE_REQUEST", action: "Submitted fault report: Laptop screen flickering on startup." },
  { id: 2, timestamp: "2026-07-11T16:00:00Z", username: "bjones", targetTag: "AF-0001", actionType: "TRANSFER_REQUEST", action: "Requested transfer of MacBook Pro 16 to Charlie White." }
];
