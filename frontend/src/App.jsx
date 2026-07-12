import React, { useState } from 'react';
import {
  LayoutDashboard,
  Network,
  FolderOpen,
  UserCheck,
  Calendar,
  Wrench,
  AlertCircle,
  Bell,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRightLeft,
  ChevronRight,
  Sliders,
  Check,
  UserPlus
} from 'lucide-react';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_CATEGORIES,
  INITIAL_ASSETS,
  INITIAL_ALLOCATIONS,
  INITIAL_BOOKINGS,
  INITIAL_TRANSFERS,
  INITIAL_MAINTENANCE
} from './mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState(INITIAL_USERS);
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [allocations, setAllocations] = useState(INITIAL_ALLOCATIONS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);
  const [maintenance, setMaintenance] = useState(INITIAL_MAINTENANCE);
  
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [assetForm, setAssetForm] = useState({ tag: '', name: '', serialNumber: '', categoryId: '', location: '', is_shared: false, ram: '', storage: '', cores: '', memory: '', capacity: '' });
  const [allocForm, setAllocForm] = useState({ assetId: '', userId: '', expectedReturnDate: '' });
  const [bookingForm, setBookingForm] = useState({ resourceId: '', userId: '', startTime: '', endTime: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ assetId: '', requestedById: '', description: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [deptForm, setDeptForm] = useState({ name: '', parentId: '', headId: '' });
  const [userForm, setUserForm] = useState({ username: '', name: '', role: 'EMPLOYEE', email: '' });

  const [assetFilter, setAssetFilter] = useState({ q: '', status: '', categoryId: '', location: '' });

  const [allocError, setAllocError] = useState('');
  const [bookingError, setBookingError] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const overdueReturns = allocations.filter(a => {
    return !a.actualReturnDate && a.expectedReturnDate && a.expectedReturnDate < todayStr;
  }).map(a => {
    const asset = assets.find(ast => ast.id === a.assetId);
    const user = users.find(u => u.id === a.userId);
    return {
      ...a,
      assetName: asset ? asset.name : 'Unknown Asset',
      assetTag: asset ? asset.tag : 'N/A',
      borrowerName: user ? user.name : 'Unknown User'
    };
  });

  const availableAssetsCount = assets.filter(a => a.status === 'AVAILABLE').count ? assets.filter(a => a.status === 'AVAILABLE').length : assets.filter(a => a.status === 'AVAILABLE').length;
  const allocatedAssetsCount = assets.filter(a => a.status === 'ALLOCATED').length;
  const activeBookingsCount = bookings.filter(b => new Date(b.endTime) > now).length;
  const pendingTransfersCount = transfers.filter(t => t.status === 'PENDING').length;
  const maintenanceTodayCount = maintenance.filter(m => m.status === 'PENDING' || m.status === 'APPROVED').length;

  const notifications = [
    ...overdueReturns.map(o => ({
      id: `overdue-${o.id}`,
      type: 'error',
      message: `Overdue Return: ${o.assetName} (${o.assetTag}) held by ${o.borrowerName} was due on ${o.expectedReturnDate}.`
    })),
    ...transfers.filter(t => t.status === 'PENDING').map(t => {
      const asset = assets.find(a => a.id === t.assetId);
      return {
        id: `transfer-${t.id}`,
        type: 'info',
        message: `Transfer Request: ${asset ? asset.name : 'Asset'} from ${users.find(u => u.id === t.fromUserId)?.name} to ${users.find(u => u.id === t.toUserId)?.name}.`
      };
    }),
    ...maintenance.filter(m => m.status === 'PENDING').map(m => {
      const asset = assets.find(a => a.id === m.assetId);
      return {
        id: `maint-${m.id}`,
        type: 'warning',
        message: `Maintenance Request: ${asset ? asset.name : 'Asset'} needs attention.`
      };
    })
  ];

  const handleApproveTransfer = (transferId) => {
    setTransfers(prev => prev.map(t => {
      if (t.id === transferId && t.status === 'PENDING') {
        setAllocations(allocs => allocs.map(a => {
          if (a.assetId === t.assetId && a.userId === t.fromUserId && !a.actualReturnDate) {
            return { ...a, actualReturnDate: todayStr };
          }
          return a;
        }));
        const newAlloc = {
          id: allocations.length + 1,
          assetId: t.assetId,
          userId: t.toUserId,
          checkedOutAt: new Date().toISOString(),
          expectedReturnDate: null,
          actualReturnDate: null
        };
        setAllocations(allocs => [...allocs, newAlloc]);
        setAssets(prevAssets => prevAssets.map(a => {
          if (a.id === t.assetId) {
            return { ...a, status: 'ALLOCATED' };
          }
          return a;
        }));
        return { ...t, status: 'APPROVED' };
      }
      return t;
    }));
  };

  const handleRejectTransfer = (transferId) => {
    setTransfers(prev => prev.map(t => {
      if (t.id === transferId && t.status === 'PENDING') {
        return { ...t, status: 'REJECTED' };
      }
      return t;
    }));
  };

  const handleApproveMaintenance = (mId) => {
    setMaintenance(prev => prev.map(m => {
      if (m.id === mId && m.status === 'PENDING') {
        setAssets(prevAssets => prevAssets.map(a => a.id === m.assetId ? { ...a, status: 'UNDER_MAINTENANCE' } : a));
        return { ...m, status: 'APPROVED' };
      }
      return m;
    }));
  };

  const handleResolveMaintenance = (mId) => {
    setMaintenance(prev => prev.map(m => {
      if (m.id === mId && m.status === 'APPROVED') {
        setAssets(prevAssets => prevAssets.map(a => a.id === m.assetId ? { ...a, status: 'AVAILABLE' } : a));
        return { ...m, status: 'RESOLVED' };
      }
      return m;
    }));
  };

  const handleRegisterAsset = (e) => {
    e.preventDefault();
    if (!assetForm.tag || !assetForm.name || !assetForm.categoryId) return;
    
    let schemaAttrs = {};
    const catId = parseInt(assetForm.categoryId);
    if (catId === 1) {
      schemaAttrs = { ram: assetForm.ram, storage: assetForm.storage };
    } else if (catId === 2) {
      schemaAttrs = { cores: parseInt(assetForm.cores) || 0, memory: assetForm.memory };
    } else if (catId === 3) {
      schemaAttrs = { capacity: parseInt(assetForm.capacity) || 0 };
    }

    const newAsset = {
      id: assets.length + 1,
      tag: assetForm.tag,
      name: assetForm.name,
      serialNumber: assetForm.serialNumber,
      categoryId: catId,
      status: 'AVAILABLE',
      location: assetForm.location,
      is_shared: assetForm.is_shared,
      attributes: schemaAttrs
    };
    
    setAssets([...assets, newAsset]);
    setAssetForm({ tag: '', name: '', serialNumber: '', categoryId: '', location: '', is_shared: false, ram: '', storage: '', cores: '', memory: '', capacity: '' });
  };

  const handleCreateAllocation = (e) => {
    e.preventDefault();
    setAllocError('');
    const aId = parseInt(allocForm.assetId);
    const uId = parseInt(allocForm.userId);
    if (!aId || !uId) return;

    const assetObj = assets.find(a => a.id === aId);
    if (!assetObj) return;

    if (assetObj.status !== 'AVAILABLE') {
      const activeAlloc = allocations.find(a => a.assetId === aId && !a.actualReturnDate);
      const holder = users.find(u => u.id === activeAlloc?.userId);
      const holderName = holder ? holder.name : 'Unknown';
      setAllocError(`Asset is not available. Currently held by ${holderName}.`);
      return;
    }

    const newAlloc = {
      id: allocations.length + 1,
      assetId: aId,
      userId: uId,
      checkedOutAt: new Date().toISOString(),
      expectedReturnDate: allocForm.expectedReturnDate || null,
      actualReturnDate: null
    };

    setAllocations([...allocations, newAlloc]);
    setAssets(prev => prev.map(a => a.id === aId ? { ...a, status: 'ALLOCATED' } : a));
    setAllocForm({ assetId: '', userId: '', expectedReturnDate: '' });
  };

  const handleCreateBooking = (e) => {
    e.preventDefault();
    setBookingError('');
    const resId = parseInt(bookingForm.resourceId);
    const uId = parseInt(bookingForm.userId);
    if (!resId || !uId || !bookingForm.startTime || !bookingForm.endTime) return;

    const start = new Date(bookingForm.startTime);
    const end = new Date(bookingForm.endTime);

    if (start >= end) {
      setBookingError('Start time must be before end time.');
      return;
    }

    const overlap = bookings.some(b => {
      if (b.resourceId !== resId) return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return start < bEnd && end > bStart;
    });

    if (overlap) {
      setBookingError('This time slot overlaps with an existing booking.');
      return;
    }

    const newBooking = {
      id: bookings.length + 1,
      resourceId: resId,
      userId: uId,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime
    };

    setBookings([...bookings, newBooking]);
    setBookingForm({ resourceId: '', userId: '', startTime: '', endTime: '' });
  };

  const handleCreateMaintenance = (e) => {
    e.preventDefault();
    const aId = parseInt(maintenanceForm.assetId);
    const uId = parseInt(maintenanceForm.requestedById);
    if (!aId || !uId || !maintenanceForm.description) return;

    const newRequest = {
      id: maintenance.length + 1,
      assetId: aId,
      requestedById: uId,
      description: maintenanceForm.description,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    setMaintenance([...maintenance, newRequest]);
    setMaintenanceForm({ assetId: '', requestedById: '', description: '' });
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!categoryForm.name) return;
    const newCat = {
      id: categories.length + 1,
      name: categoryForm.name,
      description: categoryForm.description,
      schema: {}
    };
    setCategories([...categories, newCat]);
    setCategoryForm({ name: '', description: '' });
  };

  const handleCreateDepartment = (e) => {
    e.preventDefault();
    if (!deptForm.name) return;
    const newDept = {
      id: departments.length + 1,
      name: deptForm.name,
      parentId: deptForm.parentId ? parseInt(deptForm.parentId) : null,
      headId: deptForm.headId ? parseInt(deptForm.headId) : null
    };
    setDepartments([...departments, newDept]);
    setDeptForm({ name: '', parentId: '', headId: '' });
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!userForm.username || !userForm.name) return;
    const newUser = {
      id: users.length + 1,
      username: userForm.username,
      name: userForm.name,
      role: 'EMPLOYEE',
      email: userForm.email
    };
    setUsers([...users, newUser]);
    setUserForm({ username: '', name: '', role: 'EMPLOYEE', email: '' });
  };

  const filteredAssets = assets.filter(a => {
    const matchesQ = !assetFilter.q ||
      a.tag.toLowerCase().includes(assetFilter.q.toLowerCase()) ||
      a.name.toLowerCase().includes(assetFilter.q.toLowerCase()) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(assetFilter.q.toLowerCase()));
    
    const matchesStatus = !assetFilter.status || a.status === assetFilter.status;
    const matchesCategory = !assetFilter.categoryId || a.categoryId === parseInt(assetFilter.categoryId);
    const matchesLocation = !assetFilter.location || a.location.toLowerCase().includes(assetFilter.location.toLowerCase());

    return matchesQ && matchesStatus && matchesCategory && matchesLocation;
  });

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg tracking-wider shadow-lg shadow-indigo-500/20">
              AF
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg tracking-tight">AssetFlow</h1>
              <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Enterprise</span>
            </div>
          </div>
          <nav className="mt-6 px-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('organization')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                activeTab === 'organization'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Network size={18} />
              Organization Setup
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                activeTab === 'directory'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FolderOpen size={18} />
              Asset Directory
            </button>
            <button
              onClick={() => setActiveTab('allocation')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                activeTab === 'allocation'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCheck size={18} />
              Asset Allocation
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                activeTab === 'booking'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar size={18} />
              Resource Booking
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                activeTab === 'maintenance'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Wrench size={18} />
              Maintenance Management
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              KR
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Keyur Rana</p>
              <span className="text-xs text-slate-500 font-medium">Enterprise Admin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors relative"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border border-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Feed Updates</span>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                      {notifications.length} Issues
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-slate-500 text-center">No high-priority notifications.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 flex gap-3 hover:bg-slate-50 transition-colors">
                          <AlertCircle size={16} className={`shrink-0 ${n.type === 'error' ? 'text-rose-500' : n.type === 'warning' ? 'text-amber-500' : 'text-indigo-500'}`} />
                          <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 border border-slate-200 rounded-full px-3 py-1.5 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  KR
                </div>
                <span className="text-sm font-semibold text-slate-700">keyurrana</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-700">Keyur Rana</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Admin Role</p>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); alert('Logout simulation'); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    Logout Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Assets</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{availableAssetsCount}</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Allocated Assets</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{allocatedAssetsCount}</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Wrench size={24} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Maintenance Today</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{maintenanceTodayCount}</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Bookings</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{activeBookingsCount}</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <ArrowRightLeft size={24} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Transfers</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{pendingTransfersCount}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-rose-900 text-lg leading-tight">Overdue Returns</h3>
                    <p className="text-rose-600 text-xs font-semibold">Immediate action required from operations management</p>
                  </div>
                </div>
                {overdueReturns.length === 0 ? (
                  <p className="text-rose-700 text-sm font-semibold">No assets are currently overdue.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-rose-200/50 bg-white">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-rose-100/50 text-rose-800 font-bold border-b border-rose-200/50">
                          <th className="p-4">Asset Tag</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">Current Holder</th>
                          <th className="p-4">Expected Return</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100/40 text-slate-700">
                        {overdueReturns.map(o => (
                          <tr key={o.id} className="hover:bg-rose-50/30 transition-colors">
                            <td className="p-4 font-mono font-bold text-rose-600">{o.assetTag}</td>
                            <td className="p-4 font-bold">{o.assetName}</td>
                            <td className="p-4 font-semibold">{o.borrowerName}</td>
                            <td className="p-4 font-bold text-rose-700">{o.expectedReturnDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-800 text-lg">Active Transfer Requests</h3>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold">
                      {transfers.filter(t => t.status === 'PENDING').length} Pending
                    </span>
                  </div>
                  <div className="space-y-4">
                    {transfers.filter(t => t.status === 'PENDING').length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-6">No pending asset transfer requests.</p>
                    ) : (
                      transfers.filter(t => t.status === 'PENDING').map(t => {
                        const asset = assets.find(a => a.id === t.assetId);
                        const fromUser = users.find(u => u.id === t.fromUserId);
                        const toUser = users.find(u => u.id === t.toUserId);
                        return (
                          <div key={t.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                            <div>
                              <p className="font-bold text-slate-800">{asset ? asset.name : 'Asset'}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-1">
                                <span>{fromUser?.name}</span>
                                <ChevronRight size={12} className="text-slate-400" />
                                <span>{toUser?.name}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleApproveTransfer(t.id)}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-500/10 hover:bg-indigo-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectTransfer(t.id)}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-800 text-lg">Active Maintenance Workflows</h3>
                    <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-bold">
                      {maintenance.filter(m => m.status !== 'RESOLVED' && m.status !== 'REJECTED').length} Active
                    </span>
                  </div>
                  <div className="space-y-4">
                    {maintenance.filter(m => m.status !== 'RESOLVED' && m.status !== 'REJECTED').length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-6">No active maintenance work scheduled.</p>
                    ) : (
                      maintenance.filter(m => m.status !== 'RESOLVED' && m.status !== 'REJECTED').map(m => {
                        const asset = assets.find(a => a.id === m.assetId);
                        return (
                          <div key={m.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                            <div>
                              <p className="font-bold text-slate-800">{asset ? asset.name : 'Asset'}</p>
                              <p className="text-xs text-slate-500 font-semibold mt-0.5">{m.description}</p>
                              <div className="mt-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  m.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {m.status}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {m.status === 'PENDING' ? (
                                <button
                                  onClick={() => handleApproveMaintenance(m.id)}
                                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shadow-md shadow-amber-500/10"
                                >
                                  Approve Work
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleResolveMaintenance(m.id)}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/10"
                                >
                                  Mark Resolved
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'organization' && (
            <div className="space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">Asset Categories</h3>
                  
                  <form onSubmit={handleCreateCategory} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Category Name"
                      value={categoryForm.name}
                      onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={categoryForm.description}
                      onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                    />
                    <button className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                      <Plus size={14} /> Add Category
                    </button>
                  </form>

                  <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                    {categories.map(c => (
                      <div key={c.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                        <p className="font-extrabold text-slate-800">{c.name}</p>
                        <p className="text-slate-500 font-medium mt-0.5">{c.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">Departments</h3>
                  
                  <form onSubmit={handleCreateDepartment} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Department Name"
                      value={deptForm.name}
                      onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                    />
                    <select
                      value={deptForm.parentId}
                      onChange={e => setDeptForm({ ...deptForm, parentId: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                    >
                      <option value="">Parent Department (Optional)</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <select
                      value={deptForm.headId}
                      onChange={e => setDeptForm({ ...deptForm, headId: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                    >
                      <option value="">Assign Department Head</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <button className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                      <Plus size={14} /> Add Department
                    </button>
                  </form>

                  <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                    {departments.map(d => {
                      const parent = departments.find(p => p.id === d.parentId);
                      const head = users.find(u => u.id === d.headId);
                      return (
                        <div key={d.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                          <p className="font-extrabold text-slate-800">{d.name}</p>
                          {parent && <p className="text-[10px] text-indigo-600 font-bold mt-0.5">Sub-dept of {parent.name}</p>}
                          {head && <p className="text-[10px] text-slate-500 font-medium mt-0.5">Head: {head.name}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">User Directory</h3>
                  
                  <form onSubmit={handleCreateUser} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Username"
                      value={userForm.username}
                      onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={userForm.name}
                      onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={userForm.email}
                      onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                    />
                    <button className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                      <UserPlus size={14} /> Register User
                    </button>
                  </form>

                  <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                    {users.map(u => (
                      <div key={u.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs flex items-center justify-between">
                        <div>
                          <p className="font-extrabold text-slate-800">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'directory' && (
            <div className="space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
                  <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3 mb-4">Register New Asset</h3>
                  <form onSubmit={handleRegisterAsset} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Asset Tag</label>
                      <input
                        type="text"
                        placeholder="e.g. LAP-005"
                        value={assetForm.tag}
                        onChange={e => setAssetForm({ ...assetForm, tag: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Asset Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dell Latitude 5430"
                        value={assetForm.name}
                        onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Serial Number</label>
                      <input
                        type="text"
                        placeholder="e.g. DEL49281"
                        value={assetForm.serialNumber}
                        onChange={e => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Category</label>
                      <select
                        value={assetForm.categoryId}
                        onChange={e => setAssetForm({ ...assetForm, categoryId: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {parseInt(assetForm.categoryId) === 1 && (
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">RAM</label>
                          <input
                            type="text"
                            placeholder="e.g. 16GB"
                            value={assetForm.ram}
                            onChange={e => setAssetForm({ ...assetForm, ram: e.target.value })}
                            className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Storage</label>
                          <input
                            type="text"
                            placeholder="e.g. 512GB SSD"
                            value={assetForm.storage}
                            onChange={e => setAssetForm({ ...assetForm, storage: e.target.value })}
                            className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {parseInt(assetForm.categoryId) === 2 && (
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Cores</label>
                          <input
                            type="number"
                            placeholder="e.g. 32"
                            value={assetForm.cores}
                            onChange={e => setAssetForm({ ...assetForm, cores: e.target.value })}
                            className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Memory</label>
                          <input
                            type="text"
                            placeholder="e.g. 256GB"
                            value={assetForm.memory}
                            onChange={e => setAssetForm({ ...assetForm, memory: e.target.value })}
                            className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {parseInt(assetForm.categoryId) === 3 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Capacity (People)</label>
                        <input
                          type="number"
                          placeholder="e.g. 12"
                          value={assetForm.capacity}
                          onChange={e => setAssetForm({ ...assetForm, capacity: e.target.value })}
                          className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Server Room A"
                        value={assetForm.location}
                        onChange={e => setAssetForm({ ...assetForm, location: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_shared"
                        checked={assetForm.is_shared}
                        onChange={e => setAssetForm({ ...assetForm, is_shared: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <label htmlFor="is_shared" className="text-xs font-bold text-slate-700">Is Shared / Resource Pool</label>
                    </div>
                    <button className="w-full py-3 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                      <Plus size={14} /> Register Asset
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2 space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-b border-slate-100 pb-4">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search assets..."
                        value={assetFilter.q}
                        onChange={e => setAssetFilter({ ...assetFilter, q: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                      />
                    </div>
                    <select
                      value={assetFilter.status}
                      onChange={e => setAssetFilter({ ...assetFilter, status: e.target.value })}
                      className="text-xs p-3 border border-slate-200 rounded-lg focus:outline-none text-slate-500 font-semibold"
                    >
                      <option value="">All Statuses</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="ALLOCATED">Allocated</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                      <option value="LOST">Lost</option>
                      <option value="RETIRED">Retired</option>
                      <option value="DISPOSED">Disposed</option>
                    </select>
                    <select
                      value={assetFilter.categoryId}
                      onChange={e => setAssetFilter({ ...assetFilter, categoryId: e.target.value })}
                      className="text-xs p-3 border border-slate-200 rounded-lg focus:outline-none text-slate-500 font-semibold"
                    >
                      <option value="">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Location filter..."
                      value={assetFilter.location}
                      onChange={e => setAssetFilter({ ...assetFilter, location: e.target.value })}
                      className="text-xs p-3 border border-slate-200 rounded-lg focus:outline-none font-semibold"
                    />
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                          <th className="p-4">Tag</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Location</th>
                          <th className="p-4">Attributes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredAssets.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">No assets match your search filters.</td>
                          </tr>
                        ) : (
                          filteredAssets.map(a => {
                            const cat = categories.find(c => c.id === a.categoryId);
                            return (
                              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 font-mono font-bold text-indigo-600">{a.tag}</td>
                                <td className="p-4 font-bold text-slate-800">{a.name}</td>
                                <td className="p-4">{cat ? cat.name : 'Unknown'}</td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    a.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    a.status === 'ALLOCATED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                    a.status === 'UNDER_MAINTENANCE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {a.status}
                                  </span>
                                </td>
                                <td className="p-4">{a.location || 'N/A'}</td>
                                <td className="p-4 font-mono text-[10px] text-slate-500">
                                  {Object.entries(a.attributes).map(([k, v]) => `${k}:${v}`).join(', ') || 'N/A'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

              </div>

            </div>
          )}

          {activeTab === 'allocation' && (
            <div className="space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
                  <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3 mb-4">Allocate Asset</h3>
                  
                  {allocError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 mb-4">
                      <AlertCircle size={16} className="shrink-0" />
                      <p>{allocError}</p>
                    </div>
                  )}

                  <form onSubmit={handleCreateAllocation} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Select Asset (Available Only)</label>
                      <select
                        value={allocForm.assetId}
                        onChange={e => setAllocForm({ ...allocForm, assetId: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                        required
                      >
                        <option value="">Select Asset</option>
                        {assets.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.tag}) - {a.status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Assign To User</label>
                      <select
                        value={allocForm.userId}
                        onChange={e => setAllocForm({ ...allocForm, userId: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                        required
                      >
                        <option value="">Select User</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Expected Return Date</label>
                      <input
                        type="date"
                        value={allocForm.expectedReturnDate}
                        onChange={e => setAllocForm({ ...allocForm, expectedReturnDate: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                      />
                    </div>
                    <button className="w-full py-3 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10">
                      Allocate Asset
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2 space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">Active Allocations</h3>
                  
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                          <th className="p-4">Asset</th>
                          <th className="p-4">Allocated To</th>
                          <th className="p-4">Checked Out</th>
                          <th className="p-4">Expected Return</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {allocations.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">No active allocations.</td>
                          </tr>
                        ) : (
                          allocations.map(a => {
                            const asset = assets.find(ast => ast.id === a.assetId);
                            const user = users.find(u => u.id === a.userId);
                            const isOverdue = !a.actualReturnDate && a.expectedReturnDate && a.expectedReturnDate < todayStr;
                            return (
                              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                  <p className="font-bold text-slate-800">{asset ? asset.name : 'Unknown'}</p>
                                  <span className="font-mono text-[10px] text-slate-400">{asset ? asset.tag : 'N/A'}</span>
                                </td>
                                <td className="p-4 font-semibold">{user ? user.name : 'Unknown'}</td>
                                <td className="p-4 text-slate-500">{new Date(a.checkedOutAt).toLocaleDateString()}</td>
                                <td className="p-4 text-slate-500">{a.expectedReturnDate || 'No Limit'}</td>
                                <td className="p-4">
                                  {a.actualReturnDate ? (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold text-[10px]">Returned</span>
                                  ) : isOverdue ? (
                                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-extrabold text-[10px]">Overdue</span>
                                  ) : (
                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-bold text-[10px]">Active</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'booking' && (
            <div className="space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
                  <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3 mb-4">Book Shared Resource</h3>
                  
                  {bookingError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 mb-4">
                      <AlertCircle size={16} className="shrink-0" />
                      <p>{bookingError}</p>
                    </div>
                  )}

                  <form onSubmit={handleCreateBooking} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Select Shared Resource</label>
                      <select
                        value={bookingForm.resourceId}
                        onChange={e => setBookingForm({ ...bookingForm, resourceId: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                        required
                      >
                        <option value="">Select Resource</option>
                        {assets.filter(a => a.is_shared).map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">User Booking</label>
                      <select
                        value={bookingForm.userId}
                        onChange={e => setBookingForm({ ...bookingForm, userId: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                        required
                      >
                        <option value="">Select User</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        value={bookingForm.startTime}
                        onChange={e => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        value={bookingForm.endTime}
                        onChange={e => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                        required
                      />
                    </div>
                    <button className="w-full py-3 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10">
                      Reserve Slot
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2 space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">Active Schedule Bookings</h3>
                  
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {bookings.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-8">No shared resource slots reserved.</p>
                    ) : (
                      bookings.map(b => {
                        const resource = assets.find(r => r.id === b.resourceId);
                        const user = users.find(u => u.id === b.userId);
                        return (
                          <div key={b.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-800">{resource ? resource.name : 'Shared Resource'}</p>
                              <p className="text-xs text-slate-500 font-semibold mt-0.5">Reserved by {user?.name}</p>
                            </div>
                            <div className="text-right text-xs">
                              <p className="font-mono font-bold text-indigo-600">
                                {new Date(b.startTime).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">to</p>
                              <p className="font-mono font-bold text-indigo-600">
                                {new Date(b.endTime).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
                  <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3 mb-4">Request Maintenance</h3>
                  
                  <form onSubmit={handleCreateMaintenance} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Select Asset</label>
                      <select
                        value={maintenanceForm.assetId}
                        onChange={e => setMaintenanceForm({ ...maintenanceForm, assetId: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                        required
                      >
                        <option value="">Select Asset</option>
                        {assets.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Requested By</label>
                      <select
                        value={maintenanceForm.requestedById}
                        onChange={e => setMaintenanceForm({ ...maintenanceForm, requestedById: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-slate-600"
                        required
                      >
                        <option value="">Select User</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Issues Description</label>
                      <textarea
                        rows={3}
                        placeholder="Detail issues requiring maintenance work..."
                        value={maintenanceForm.description}
                        onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold"
                        required
                      ></textarea>
                    </div>
                    <button className="w-full py-3 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10">
                      Submit request
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2 space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">Maintenance Directory Logs</h3>
                  
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                          <th className="p-4">Asset</th>
                          <th className="p-4">Reported By</th>
                          <th className="p-4">Description</th>
                          <th className="p-4">Reported Date</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {maintenance.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">No maintenance entries recorded.</td>
                          </tr>
                        ) : (
                          maintenance.map(m => {
                            const asset = assets.find(ast => ast.id === m.assetId);
                            const user = users.find(u => u.id === m.requestedById);
                            return (
                              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 font-bold text-slate-800">{asset ? asset.name : 'Unknown'}</td>
                                <td className="p-4 font-semibold text-slate-600">{user ? user.name : 'Unknown'}</td>
                                <td className="p-4 text-slate-500 max-w-[200px] truncate">{m.description}</td>
                                <td className="p-4 text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    m.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    m.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                    m.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    'bg-slate-50 text-slate-500'
                                  }`}>
                                    {m.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
