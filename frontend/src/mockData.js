export const INITIAL_USERS = [
  { id: 1, username: 'admin', name: 'Keyur Rana', role: 'ADMIN', email: 'ranakeyur38@gmail.com', departmentId: 1, joinDate: '2024-01-15', phone: '+91 98765 43210' },
  { id: 2, username: 'jdoe', name: 'John Doe', role: 'ASSET_MANAGER', email: 'john.doe@assetflow.io', departmentId: 1, joinDate: '2024-03-10', phone: '+91 91234 56789' },
  { id: 3, username: 'asmith', name: 'Alice Smith', role: 'DEPARTMENT_HEAD', email: 'alice.smith@assetflow.io', departmentId: 2, joinDate: '2024-02-20', phone: '+91 99887 76655' },
  { id: 4, username: 'bjones', name: 'Bob Jones', role: 'EMPLOYEE', email: 'bob.jones@assetflow.io', departmentId: 2, joinDate: '2024-05-01', phone: '+91 88776 65544' },
  { id: 5, username: 'cwhite', name: 'Charlie White', role: 'EMPLOYEE', email: 'charlie.white@assetflow.io', departmentId: 3, joinDate: '2024-06-15', phone: '+91 77665 54433' },
  { id: 6, username: 'priya', name: 'Priya Sharma', role: 'EMPLOYEE', email: 'priya.sharma@assetflow.io', departmentId: 1, joinDate: '2024-07-01', phone: '+91 66554 43322' },
  { id: 7, username: 'rmehra', name: 'Raj Mehra', role: 'EMPLOYEE', email: 'raj.mehra@assetflow.io', departmentId: 4, joinDate: '2024-08-10', phone: '+91 55443 32211' },
];

export const INITIAL_DEPARTMENTS = [
  { id: 1, name: 'Engineering', parentId: null, headId: 3, isActive: true },
  { id: 2, name: 'Quality Assurance', parentId: 1, headId: 4, isActive: true },
  { id: 3, name: 'Finance', parentId: null, headId: null, isActive: true },
  { id: 4, name: 'Human Resources', parentId: null, headId: 7, isActive: true },
  { id: 5, name: 'Frontend Team', parentId: 1, headId: 6, isActive: true },
  { id: 6, name: 'Backend Team', parentId: 1, headId: 2, isActive: true },
];

export const INITIAL_CATEGORIES = [
  { id: 1, name: 'Electronics', description: 'Laptops, servers, monitors, and computing hardware', schema: { warrantyYears: 'number', manufacturer: 'string', modelNumber: 'string', processorType: 'string' } },
  { id: 2, name: 'Furniture', description: 'Desks, chairs, cabinets, and office fixtures', schema: { material: 'string', color: 'string', weightCapacityKg: 'number' } },
  { id: 3, name: 'Vehicles', description: 'Fleet cars, delivery vans, and company transport', schema: { licensePlate: 'string', engineType: 'string', fuelType: 'string', seatingCapacity: 'number' } },
  { id: 4, name: 'AV Equipment', description: 'Projectors, cameras, microphones, and display systems', schema: { resolution: 'string', connectivity: 'string', lumens: 'number' } },
  { id: 5, name: 'Networking', description: 'Routers, switches, access points, and cabling infrastructure', schema: { portCount: 'number', speedGbps: 'number', managedSwitch: 'boolean' } },
];

export const INITIAL_ASSETS = [
  { id: 1, tag: 'AF-0001', name: 'MacBook Pro 16"', serialNumber: 'C02DF124MD6M', categoryId: 1, status: 'ALLOCATED', location: 'HQ-Floor 3', is_shared: false, acquisitionDate: '2026-01-10', cost: 2499, condition: 'Excellent', attributes: { warrantyYears: 3, manufacturer: 'Apple', modelNumber: 'MK1H3LL/A', processorType: 'M1 Pro' } },
  { id: 2, tag: 'AF-0002', name: 'ThinkPad T14 Gen 3', serialNumber: 'PF24B6G1', categoryId: 1, status: 'AVAILABLE', location: 'HQ-Floor 3', is_shared: false, acquisitionDate: '2026-02-15', cost: 1299, condition: 'Good', attributes: { warrantyYears: 2, manufacturer: 'Lenovo', modelNumber: '21AH00BKIN', processorType: 'AMD Ryzen 7' } },
  { id: 3, tag: 'AF-0003', name: 'Dell PowerEdge R750', serialNumber: 'DELL8362XS', categoryId: 1, status: 'AVAILABLE', location: 'Server Room B', is_shared: true, acquisitionDate: '2025-11-20', cost: 7499, condition: 'Excellent', attributes: { warrantyYears: 5, manufacturer: 'Dell', modelNumber: 'PowerEdge R750', processorType: 'Intel Xeon Gold' } },
  { id: 4, tag: 'AF-0004', name: 'Executive Standing Desk', serialNumber: 'FN-893-MAHOG', categoryId: 2, status: 'AVAILABLE', location: 'HQ-Floor 2', is_shared: false, acquisitionDate: '2026-03-01', cost: 850, condition: 'Good', attributes: { material: 'Mahogany', color: 'Walnut Brown', weightCapacityKg: 80 } },
  { id: 5, tag: 'AF-0005', name: 'Ford Transit Van', serialNumber: 'VH-7721-FORD', categoryId: 3, status: 'AVAILABLE', location: 'Garage Plot A', is_shared: true, acquisitionDate: '2025-06-15', cost: 32000, condition: 'Fair', attributes: { licensePlate: 'GJ-01-XX-9921', engineType: 'V6 Turbocharged', fuelType: 'Diesel', seatingCapacity: 9 } },
  { id: 6, tag: 'AF-0006', name: 'Ergonomic Mesh Chair', serialNumber: 'FN-991-MESH', categoryId: 2, status: 'ALLOCATED', location: 'HQ-Floor 2', is_shared: false, acquisitionDate: '2026-03-05', cost: 299, condition: 'Good', attributes: { material: 'Mesh/Fabric', color: 'Charcoal Black', weightCapacityKg: 120 } },
  { id: 7, tag: 'AF-0007', name: 'Epson EB-L615U Projector', serialNumber: 'EPX-4421-L6', categoryId: 4, status: 'AVAILABLE', location: 'Conference Room A', is_shared: true, acquisitionDate: '2025-09-10', cost: 1850, condition: 'Excellent', attributes: { resolution: '1920x1200 WUXGA', connectivity: 'HDMI/USB-C/LAN', lumens: 6000 } },
  { id: 8, tag: 'AF-0008', name: 'Cisco Catalyst 9300', serialNumber: 'CSC-9300-48P', categoryId: 5, status: 'UNDER_MAINTENANCE', location: 'Server Room B', is_shared: false, acquisitionDate: '2025-08-01', cost: 4200, condition: 'Fair', attributes: { portCount: 48, speedGbps: 10, managedSwitch: true } },
  { id: 9, tag: 'AF-0009', name: 'HP LaserJet Pro M404', serialNumber: 'HP-LJ-M404-7', categoryId: 1, status: 'RETIRED', location: 'Storage Room', is_shared: false, acquisitionDate: '2023-04-20', cost: 399, condition: 'Poor', attributes: { warrantyYears: 1, manufacturer: 'HP', modelNumber: 'M404dn', processorType: 'N/A' } },
  { id: 10, tag: 'AF-0010', name: 'Toyota Innova Crysta', serialNumber: 'TYT-INN-2024', categoryId: 3, status: 'RESERVED', location: 'Garage Plot B', is_shared: true, acquisitionDate: '2024-12-01', cost: 28500, condition: 'Excellent', attributes: { licensePlate: 'GJ-05-AB-1234', engineType: 'Inline-4', fuelType: 'Petrol', seatingCapacity: 7 } },
];

// Dynamically generate extra assets to match 80+ assets for Phase 3 mockup
const categoriesList = [
  { id: 1, prefix: 'AF', names: ['MacBook Pro 14', 'ThinkPad X1 Carbon', 'HP EliteBook 830', 'Dell XPS 13', 'Lenovo Yoga 9i'] },
  { id: 2, prefix: 'FN', names: ['Steelcase Gesture Chair', 'Task Chair Basic', 'Whiteboard Mobile', 'Executive Desk Oak'] },
  { id: 3, prefix: 'VH', names: ['Ford Transit Van', 'Toyota Innova Crysta', 'Tesla Model 3'] },
  { id: 4, prefix: 'AV', names: ['Epson EB-L615U Projector', 'Sony Alpha 7 IV', 'Shure SM7B Microphone'] },
  { id: 5, prefix: 'NW', names: ['Aruba Access Point 303', 'Palo Alto PA-3220', 'Fortinet FortiGate 60F'] }
];
const statuses = ['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'];

for (let i = 11; i <= 85; i++) {
  const cat = categoriesList[i % categoriesList.length];
  const nameTemplate = cat.names[i % cat.names.length];
  const name = `${nameTemplate} #${i}`;
  const tag = `AF-${String(i).padStart(4, '0')}`;
  const serial = `SN-${cat.id}${cat.prefix}${String(i).padStart(5, '0')}`;
  const status = statuses[i % statuses.length];
  const location = `Floor ${(i % 4) + 1} - Zone ${String.fromCharCode(65 + (i % 3))}`;
  const is_shared = (cat.id === 3 || cat.id === 4);
  const cost = 100 + (i * 25) % 1500;
  
  INITIAL_ASSETS.push({
    id: i,
    tag: tag,
    name: name,
    serialNumber: serial,
    categoryId: cat.id,
    status: status,
    location: location,
    is_shared: is_shared,
    acquisitionDate: '2026-04-12',
    cost: cost,
    condition: i % 2 === 0 ? 'Good' : 'Excellent',
    attributes: cat.id === 1 ? { warrantyYears: 3, manufacturer: 'Apple', modelNumber: 'MK-GEN', processorType: 'M-Generic' } : {}
  });
}


export const INITIAL_ALLOCATIONS = [
  { id: 1, assetId: 1, userId: 4, checkedOutAt: '2026-07-01T09:00:00Z', expectedReturnDate: '2026-07-10', actualReturnDate: null },
  { id: 2, assetId: 6, userId: 5, checkedOutAt: '2026-07-05T10:00:00Z', expectedReturnDate: '2026-07-25', actualReturnDate: null },
  { id: 3, assetId: 2, userId: 6, checkedOutAt: '2026-06-01T08:00:00Z', expectedReturnDate: '2026-06-30', actualReturnDate: '2026-06-30' },
  { id: 4, assetId: 4, userId: 3, checkedOutAt: '2026-05-15T09:00:00Z', expectedReturnDate: '2026-06-15', actualReturnDate: '2026-06-14' },
];

export const INITIAL_BOOKINGS = [
  { id: 1, resourceId: 5, userId: 3, startTime: '2026-07-12T10:00:00', endTime: '2026-07-12T12:00:00', is_cancelled: false },
  { id: 2, resourceId: 3, userId: 4, startTime: '2026-07-12T14:00:00', endTime: '2026-07-12T17:00:00', is_cancelled: false },
  { id: 3, resourceId: 7, userId: 2, startTime: '2026-07-13T09:00:00', endTime: '2026-07-13T11:00:00', is_cancelled: false },
  { id: 4, resourceId: 10, userId: 6, startTime: '2026-07-14T08:00:00', endTime: '2026-07-14T18:00:00', is_cancelled: false },
  { id: 5, resourceId: 5, userId: 7, startTime: '2026-07-15T13:00:00', endTime: '2026-07-15T16:00:00', is_cancelled: false },
];

export const INITIAL_TRANSFERS = [
  { id: 1, assetId: 1, fromUserId: 4, toUserId: 5, requestedById: 4, status: 'REQUESTED', createdAt: '2026-07-11T16:00:00Z' },
  { id: 2, assetId: 6, fromUserId: 5, toUserId: 7, requestedById: 2, status: 'APPROVED', createdAt: '2026-07-08T11:00:00Z' },
];

export const INITIAL_MAINTENANCE = [
  { id: 1, assetId: 2, requestedById: 4, description: 'Laptop screen flickering on startup. Display shows horizontal lines after 10 minutes of use.', status: 'PENDING', createdAt: '2026-07-11T09:30:00Z', priority: 'High', resolvedAt: null },
  { id: 2, assetId: 8, requestedById: 2, description: 'Network switch dropping packets intermittently. Port 24 completely unresponsive.', status: 'APPROVED', createdAt: '2026-07-09T14:00:00Z', priority: 'High', resolvedAt: null },
  { id: 3, assetId: 4, requestedById: 3, description: 'Height adjustment mechanism jammed. Cannot lower desk below 90cm.', status: 'RESOLVED', createdAt: '2026-07-05T10:00:00Z', priority: 'Low', resolvedAt: '2026-07-07T15:00:00Z' },
  { id: 4, assetId: 7, requestedById: 6, description: 'Projector lamp showing end-of-life warning. Image brightness significantly reduced.', status: 'PENDING', createdAt: '2026-07-12T08:00:00Z', priority: 'Medium', resolvedAt: null },
];

export const INITIAL_AUDIT_CYCLES = [
  { id: 1, title: 'Q3 Electronics Audit', location: 'HQ-Floor 3', departmentId: 1, startDate: '2026-07-01', endDate: '2026-07-15', isClosed: false, auditorId: 2 },
  { id: 2, title: 'Q2 Furniture Inventory Check', location: 'HQ-Floor 2', departmentId: 2, startDate: '2026-04-01', endDate: '2026-04-10', isClosed: true, auditorId: 3 },
];

export const INITIAL_AUDIT_ENTRIES = [
  { id: 1, cycleId: 1, assetId: 1, status: 'VERIFIED', notes: 'Verified in user possession — Bob Jones, Floor 3 desk 14' },
  { id: 2, cycleId: 1, assetId: 2, status: 'PENDING', notes: '' },
  { id: 3, cycleId: 1, assetId: 3, status: 'MISSING', notes: 'Server rack slot B-12 found empty during physical check' },
  { id: 4, cycleId: 1, assetId: 8, status: 'DAMAGED', notes: 'Physical damage on port panel — dents visible on chassis' },
  { id: 5, cycleId: 2, assetId: 4, status: 'VERIFIED', notes: 'Located in executive suite, Floor 2' },
  { id: 6, cycleId: 2, assetId: 6, status: 'VERIFIED', notes: 'Chair confirmed at workstation 2B' },
];

export const INITIAL_SYSTEM_LOGS = [
  { id: 1, timestamp: '2026-07-12T09:30:00Z', username: 'bjones', targetTag: 'AF-0002', actionType: 'MAINTENANCE_REQUEST', action: 'Submitted fault report: Laptop screen flickering on startup.', before: 'AVAILABLE', after: 'PENDING_MAINTENANCE' },
  { id: 2, timestamp: '2026-07-11T16:00:00Z', username: 'bjones', targetTag: 'AF-0001', actionType: 'TRANSFER_REQUEST', action: 'Requested transfer of MacBook Pro 16 to Charlie White.', before: 'ALLOCATED:bjones', after: 'TRANSFER_REQUESTED' },
  { id: 3, timestamp: '2026-07-09T14:00:00Z', username: 'jdoe', targetTag: 'AF-0008', actionType: 'MAINTENANCE_APPROVED', action: 'Maintenance ticket approved. Asset status set to Under Maintenance.', before: 'AVAILABLE', after: 'UNDER_MAINTENANCE' },
  { id: 4, timestamp: '2026-07-08T11:00:00Z', username: 'jdoe', targetTag: 'AF-0006', actionType: 'TRANSFER_APPROVED', action: 'Transfer approved. Allocation closed for cwhite, new allocation opened for rmehra.', before: 'ALLOCATED:cwhite', after: 'ALLOCATED:rmehra' },
  { id: 5, timestamp: '2026-07-07T15:00:00Z', username: 'jdoe', targetTag: 'AF-0004', actionType: 'MAINTENANCE_RESOLVED', action: 'Maintenance resolved. Asset status restored to Available.', before: 'UNDER_MAINTENANCE', after: 'AVAILABLE' },
  { id: 6, timestamp: '2026-07-05T10:00:00Z', username: 'asmith', targetTag: 'AF-0004', actionType: 'ALLOCATION_OPEN', action: 'Asset AF-0004 allocated to Alice Smith.', before: 'AVAILABLE', after: 'ALLOCATED' },
  { id: 7, timestamp: '2026-07-01T09:00:00Z', username: 'admin', targetTag: 'AF-0001', actionType: 'ALLOCATION_OPEN', action: 'Asset AF-0001 allocated to Bob Jones.', before: 'AVAILABLE', after: 'ALLOCATED' },
  { id: 8, timestamp: '2026-06-30T17:00:00Z', username: 'priya', targetTag: 'AF-0002', actionType: 'ALLOCATION_CLOSE', action: 'Asset AF-0002 returned by Priya Sharma. Condition: Good.', before: 'ALLOCATED', after: 'AVAILABLE' },
  { id: 9, timestamp: '2026-06-15T08:00:00Z', username: 'admin', targetTag: 'AF-0010', actionType: 'STATE_CHANGE', action: 'Asset AF-0010 status changed from AVAILABLE to RESERVED.', before: 'AVAILABLE', after: 'RESERVED' },
  { id: 10, timestamp: '2026-06-01T09:00:00Z', username: 'admin', targetTag: 'AF-0009', actionType: 'STATE_CHANGE', action: 'Asset AF-0009 status changed from AVAILABLE to RETIRED.', before: 'AVAILABLE', after: 'RETIRED' },
];
