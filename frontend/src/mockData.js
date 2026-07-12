export const INITIAL_USERS = [
  { id: 1, username: "admin", name: "Keyur Rana", role: "ADMIN", email: "ranakeyur38@gmail.com" },
  { id: 2, username: "jdoe", name: "John Doe", role: "ASSET_MANAGER", email: "john@example.com" },
  { id: 3, username: "asmith", name: "Alice Smith", role: "DEPARTMENT_HEAD", email: "alice@example.com" },
  { id: 4, username: "bjones", name: "Bob Jones", role: "EMPLOYEE", email: "bob@example.com" },
  { id: 5, username: "cwhite", name: "Charlie White", role: "EMPLOYEE", email: "charlie@example.com" }
];

export const INITIAL_DEPARTMENTS = [
  { id: 1, name: "Engineering", parentId: null, headId: 3 },
  { id: 2, name: "QA", parentId: 1, headId: null },
  { id: 3, name: "Finance", parentId: null, headId: null }
];

export const INITIAL_CATEGORIES = [
  { id: 1, name: "Laptops", description: "Company issued laptops", schema: { ram: "string", storage: "string" } },
  { id: 2, name: "Servers", description: "Rack mounted servers", schema: { cores: "number", memory: "string" } },
  { id: 3, name: "Conference Rooms", description: "Meeting rooms", schema: { capacity: "number" } }
];

export const INITIAL_ASSETS = [
  { id: 1, tag: "LAP-001", name: "MacBook Pro 16", serialNumber: "C02DF124MD6M", categoryId: 1, status: "ALLOCATED", location: "HQ-Floor 3", is_shared: false, attributes: { ram: "32GB", storage: "1TB SSD" } },
  { id: 2, tag: "LAP-002", name: "ThinkPad T14", serialNumber: "PF24B6G1", categoryId: 1, status: "AVAILABLE", location: "HQ-Floor 3", is_shared: false, attributes: { ram: "16GB", storage: "512GB SSD" } },
  { id: 3, tag: "SRV-001", name: "Dell PowerEdge R750", serialNumber: "DELL8362", categoryId: 2, status: "AVAILABLE", location: "Server Room B", is_shared: true, attributes: { cores: 32, memory: "128GB" } },
  { id: 4, tag: "RM-101", name: "Boardroom Alpha", serialNumber: "N/A", categoryId: 3, status: "AVAILABLE", location: "HQ-Floor 1", is_shared: true, attributes: { capacity: 15 } },
  { id: 5, tag: "LAP-003", name: "MacBook Air M2", serialNumber: "C02KF981MD6N", categoryId: 1, status: "UNDER_MAINTENANCE", location: "IT Desk", is_shared: false, attributes: { ram: "8GB", storage: "256GB SSD" } },
  { id: 6, tag: "LAP-004", name: "Dell Latitude 5430", serialNumber: "DEL49281", categoryId: 1, status: "ALLOCATED", location: "HQ-Floor 2", is_shared: false, attributes: { ram: "16GB", storage: "512GB SSD" } }
];

export const INITIAL_ALLOCATIONS = [
  { id: 1, assetId: 1, userId: 4, checkedOutAt: "2026-07-01T09:00:00Z", expectedReturnDate: "2026-07-10", actualReturnDate: null },
  { id: 2, assetId: 6, userId: 5, checkedOutAt: "2026-07-05T10:00:00Z", expectedReturnDate: "2026-07-25", actualReturnDate: null }
];

export const INITIAL_BOOKINGS = [
  { id: 1, resourceId: 4, userId: 3, startTime: "2026-07-12T10:00:00", endTime: "2026-07-12T12:00:00" },
  { id: 2, resourceId: 3, userId: 4, startTime: "2026-07-12T14:00:00", endTime: "2026-07-12T17:00:00" }
];

export const INITIAL_TRANSFERS = [
  { id: 1, assetId: 1, fromUserId: 4, toUserId: 5, requestedById: 4, status: "PENDING", createdAt: "2026-07-11T16:00:00Z" }
];

export const INITIAL_MAINTENANCE = [
  { id: 1, assetId: 5, requestedById: 2, description: "Battery replacement required", status: "APPROVED", createdAt: "2026-07-11T09:30:00Z" }
];
