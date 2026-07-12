import React, { useState } from 'react';
import { 
  INITIAL_USERS, 
  INITIAL_DEPARTMENTS, 
  INITIAL_CATEGORIES, 
  INITIAL_ASSETS, 
  INITIAL_ALLOCATIONS, 
  INITIAL_BOOKINGS, 
  INITIAL_TRANSFERS, 
  INITIAL_MAINTENANCE, 
  INITIAL_AUDIT_CYCLES, 
  INITIAL_AUDIT_ENTRIES, 
  INITIAL_SYSTEM_LOGS 
} from './mockData';

export default function App() {
  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]); 
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [users, setUsers] = useState(INITIAL_USERS);
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [allocations, setAllocations] = useState(INITIAL_ALLOCATIONS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);
  const [maintenance, setMaintenance] = useState(INITIAL_MAINTENANCE);
  const [auditCycles, setAuditCycles] = useState(INITIAL_AUDIT_CYCLES);
  const [auditEntries, setAuditEntries] = useState(INITIAL_AUDIT_ENTRIES);
  const [logs, setLogs] = useState(INITIAL_SYSTEM_LOGS);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null); 
  const [activeOrgTab, setActiveOrgTab] = useState('departments'); 

  const [authMode, setAuthMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupDept, setSignupDept] = useState('1');

  const [regName, setRegName] = useState('');
  const [regCat, setRegCat] = useState('1');
  const [regSerial, setRegSerial] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regShared, setRegShared] = useState(false);
  const [regCost, setRegCost] = useState('');

  const [dirSearch, setDirSearch] = useState('');
  const [dirStatus, setDirStatus] = useState('ALL');

  const [allocAsset, setAllocAsset] = useState('');
  const [allocUser, setAllocUser] = useState('4');
  const [allocReturn, setAllocReturn] = useState('');
  const [allocConflictMsg, setAllocConflictMsg] = useState(null);

  const [returnAssetId, setReturnAssetId] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  const [bookResource, setBookResource] = useState('3');
  const [bookStart, setBookStart] = useState('');
  const [bookEnd, setBookEnd] = useState('');
  const [bookError, setBookError] = useState(null);

  const [maintAsset, setMaintAsset] = useState('1');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintPriority, setMaintPriority] = useState('Medium');

  const [auditPlanLocation, setAuditPlanLocation] = useState('');
  const [auditPlanAuditor, setAuditPlanAuditor] = useState('2');
  const [auditReport, setAuditReport] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = users.find(u => u.email === loginEmail) || users[0];
    setCurrentUser(foundUser);
    setCurrentView('dashboard');
  };

  const handleSignup = (e) => {
    e.preventDefault();
    const newUser = {
      id: users.length + 1,
      username: signupEmail.split('@')[0],
      name: signupName,
      role: 'EMPLOYEE',
      email: signupEmail,
      departmentId: parseInt(signupDept)
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setCurrentView('dashboard');
  };

  const handleRegisterAsset = (e) => {
    e.preventDefault();
    const nextTag = `AF-${(assets.length + 1).toString().padStart(4, '0')}`;
    const newAsset = {
      id: assets.length + 1,
      tag: nextTag,
      name: regName,
      serialNumber: regSerial,
      categoryId: parseInt(regCat),
      status: 'AVAILABLE',
      location: regLocation,
      is_shared: regShared,
      acquisitionDate: new Date().toISOString().split('T')[0],
      cost: parseFloat(regCost) || 500,
      condition: 'Excellent',
      attributes: {}
    };
    setAssets([...assets, newAsset]);
    setLogs([{
      id: logs.length + 1,
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      targetTag: nextTag,
      actionType: 'REGISTER_ASSET',
      action: `Registered new asset ${newAsset.name} under tag ${nextTag}.`
    }, ...logs]);
    setRegName('');
    setRegSerial('');
    setRegLocation('');
    setRegCost('');
  };

  const handleAllocationAssetChange = (assetId) => {
    setAllocAsset(assetId);
    if (!assetId) {
      setAllocConflictMsg(null);
      return;
    }
    const target = assets.find(a => a.id === parseInt(assetId));
    if (target && target.status !== 'AVAILABLE') {
      const activeAlloc = allocations.find(al => al.assetId === target.id && al.actualReturnDate === null);
      let holder = 'Unknown';
      if (activeAlloc) {
        const u = users.find(usr => usr.id === activeAlloc.userId);
        if (u) holder = u.name;
      }
      setAllocConflictMsg(`Currently held by ${holder}`);
    } else {
      setAllocConflictMsg(null);
    }
  };

  const handleCreateAllocation = (e) => {
    e.preventDefault();
    const targetAsset = assets.find(a => a.id === parseInt(allocAsset));
    if (!targetAsset || targetAsset.status !== 'AVAILABLE') return;

    const newAlloc = {
      id: allocations.length + 1,
      assetId: targetAsset.id,
      userId: parseInt(allocUser),
      checkedOutAt: new Date().toISOString(),
      expectedReturnDate: allocReturn,
      actualReturnDate: null
    };

    setAllocations([...allocations, newAlloc]);
    setAssets(assets.map(a => a.id === targetAsset.id ? { ...a, status: 'ALLOCATED' } : a));
    setLogs([{
      id: logs.length + 1,
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      targetTag: targetAsset.tag,
      actionType: 'ALLOCATE_ASSET',
      action: `Allocated asset ${targetAsset.tag} to user ID ${allocUser}.`
    }, ...logs]);
    setAllocAsset('');
  };

  const handleInitiateTransfer = () => {
    const targetAsset = assets.find(a => a.id === parseInt(allocAsset));
    if (!targetAsset) return;

    const activeAlloc = allocations.find(al => al.assetId === targetAsset.id && al.actualReturnDate === null);
    if (!activeAlloc) return;

    const newTransfer = {
      id: transfers.length + 1,
      assetId: targetAsset.id,
      fromUserId: activeAlloc.userId,
      toUserId: parseInt(allocUser),
      requestedById: currentUser.id,
      status: 'REQUESTED',
      createdAt: new Date().toISOString()
    };

    setTransfers([...transfers, newTransfer]);
    setLogs([{
      id: logs.length + 1,
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      targetTag: targetAsset.tag,
      actionType: 'TRANSFER_REQUEST',
      action: `Requested transfer of asset ${targetAsset.tag} to user ID ${allocUser}.`
    }, ...logs]);
    setAllocAsset('');
    setAllocConflictMsg(null);
  };

  const handleApproveTransfer = (transId) => {
    const trans = transfers.find(t => t.id === transId);
    if (!trans) return;

    const activeAlloc = allocations.find(al => al.assetId === trans.assetId && al.actualReturnDate === null);
    
    setAllocations(allocations.map(al => al.id === activeAlloc.id ? { ...al, actualReturnDate: new Date().toISOString().split('T')[0] } : al).concat({
      id: allocations.length + 1,
      assetId: trans.assetId,
      userId: trans.toUserId,
      checkedOutAt: new Date().toISOString(),
      expectedReturnDate: '',
      actualReturnDate: null
    }));

    setTransfers(transfers.map(t => t.id === transId ? { ...t, status: 'APPROVED' } : t));
    
    const assetObj = assets.find(a => a.id === trans.assetId);
    setLogs([{
      id: logs.length + 1,
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      targetTag: assetObj ? assetObj.tag : `ID ${trans.assetId}`,
      actionType: 'TRANSFER_APPROVED',
      action: `Approved transfer request for asset ID ${trans.assetId}.`
    }, ...logs]);
  };

  const handleProcessReturn = (e) => {
    e.preventDefault();
    const assetIdNum = parseInt(returnAssetId);
    const activeAlloc = allocations.find(al => al.assetId === assetIdNum && al.actualReturnDate === null);
    if (!activeAlloc) return;

    setAllocations(allocations.map(al => al.id === activeAlloc.id ? { ...al, actualReturnDate: new Date().toISOString().split('T')[0] } : al));
    setAssets(assets.map(a => a.id === assetIdNum ? { ...a, status: 'AVAILABLE' } : a));
    
    const assetObj = assets.find(a => a.id === assetIdNum);
    setLogs([{
      id: logs.length + 1,
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      targetTag: assetObj ? assetObj.tag : '',
      actionType: 'RETURN_ASSET',
      action: `Processed return of asset. Condition Notes: ${returnNotes}`
    }, ...logs]);

    setReturnAssetId('');
    setReturnNotes('');
  };

  const handleCreateBooking = (e) => {
    e.preventDefault();
    const start = new Date(bookStart);
    const end = new Date(bookEnd);
    if (start >= end) {
      setBookError("Start time must be before end time.");
      return;
    }

    const overlap = bookings.find(b => 
      b.resourceId === parseInt(bookResource) && 
      !b.is_cancelled &&
      new Date(b.startTime) < end && 
      new Date(b.endTime) > start
    );

    if (overlap) {
      setBookError("Time Slot Overlap Conflict: The resource is already reserved for this duration.");
      return;
    }

    const newBooking = {
      id: bookings.length + 1,
      resourceId: parseInt(bookResource),
      userId: currentUser.id,
      startTime: bookStart,
      endTime: bookEnd,
      is_cancelled: false
    };

    setBookings([...bookings, newBooking]);
    setBookError(null);
    setBookStart('');
    setBookEnd('');
  };

  const handleRaiseMaintenance = (e) => {
    e.preventDefault();
    const newMaint = {
      id: maintenance.length + 1,
      assetId: parseInt(maintAsset),
      requestedById: currentUser.id,
      description: maintDesc,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      priority: maintPriority
    };

    setMaintenance([...maintenance, newMaint]);
    setMaintDesc('');
  };

  const handleUpdateMaintenanceStatus = (id, newStatus) => {
    setMaintenance(maintenance.map(m => m.id === id ? { ...m, status: newStatus } : m));
    const ticket = maintenance.find(m => m.id === id);
    if (!ticket) return;

    if (newStatus === 'APPROVED') {
      setAssets(assets.map(a => a.id === ticket.assetId ? { ...a, status: 'UNDER_MAINTENANCE' } : a));
    } else if (newStatus === 'RESOLVED') {
      setAssets(assets.map(a => a.id === ticket.assetId ? { ...a, status: 'AVAILABLE' } : a));
    }
  };

  const handleUpdateAuditStatus = (entryId, nextStatus) => {
    setAuditEntries(auditEntries.map(e => e.id === entryId ? { ...e, status: nextStatus } : e));
  };

  const handleCloseAuditCycle = (cycleId) => {
    const cycleEntries = auditEntries.filter(e => e.cycleId === cycleId);
    const missingAssetIds = cycleEntries.filter(e => e.status === 'MISSING').map(e => e.assetId);

    setAssets(assets.map(a => missingAssetIds.includes(a.id) ? { ...a, status: 'LOST' } : a));
    setAuditCycles(auditCycles.map(c => c.id === cycleId ? { ...c, isClosed: true } : c));

    setAuditReport({
      total: cycleEntries.length,
      verified: cycleEntries.filter(e => e.status === 'VERIFIED').map(e => assets.find(a => a.id === e.assetId)?.name),
      missing: cycleEntries.filter(e => e.status === 'MISSING').map(e => assets.find(a => a.id === e.assetId)?.name),
      damaged: cycleEntries.filter(e => e.status === 'DAMAGED').map(e => assets.find(a => a.id === e.assetId)?.name)
    });
  };

  const handlePromoteRole = (userId, nextRole) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: nextRole } : u));
  };

  const activeDeptObj = departments.find(d => d.id === currentUser.departmentId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-lg tracking-wider text-indigo-400">ASSETFLOW</span>
          <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-400 font-semibold uppercase">Enterprise ERP</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400">Department</p>
            <p className="text-xs font-extrabold text-indigo-300">{activeDeptObj ? activeDeptObj.name : 'Unassigned'}</p>
          </div>

          <div className="relative">
            <button 
              onClick={() => setNotificationOpen(!notificationOpen)} 
              className="p-1.5 hover:bg-slate-800 rounded-lg relative text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>
            {notificationOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50">
                <p className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3">Live Notification Stream</p>
                <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto">
                  <div className="p-2 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-300">
                    <span className="font-bold uppercase tracking-wide text-[10px] text-red-400 block mb-0.5">Warning</span>
                    Asset AF-0001 check-in deadline has passed. Overdue.
                  </div>
                  <div className="p-2 bg-indigo-950/40 border border-indigo-900/50 rounded-lg text-xs text-indigo-300">
                    <span className="font-bold uppercase tracking-wide text-[10px] text-indigo-400 block mb-0.5">Update</span>
                    Transfer request initiated for MacBook Pro 16.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-extrabold text-xs text-white">
              {currentUser.name.split(' ').map(n=>n[0]).join('')}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">{currentUser.name}</p>
              <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wide">{currentUser.role.replace('_', ' ')}</p>
            </div>
            <button 
              onClick={() => {
                setCurrentUser(null);
                setCurrentView('auth');
              }} 
              className="text-xs hover:text-red-400 ml-2 text-slate-400 font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {currentUser && (
          <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-1.5 shrink-0">
            <p className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase px-3 mb-2">Main Navigation</p>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'organization', label: 'Organization Setup', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', adminOnly: true },
              { id: 'directory', label: 'Asset Directory', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
              { id: 'allocation', label: 'Asset Allocation', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
              { id: 'booking', label: 'Resource Booking', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { id: 'maintenance', label: 'Maintenance Management', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
              { id: 'audit', label: 'Asset Audit Console', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'reports', label: 'Reports & Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z' },
              { id: 'logs', label: 'Audit Trail & Logs', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
            ].map(item => {
              if (item.adminOnly && currentUser.role !== 'ADMIN') return null;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </aside>
        )}

        <main className="flex-1 overflow-y-auto p-8">
          
          {currentView === 'auth' && (
            <div className="max-w-md mx-auto my-12 bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
              <div className="flex gap-4 mb-6 border-b border-slate-700 pb-4">
                <button 
                  onClick={() => setAuthMode('login')} 
                  className={`flex-1 text-center font-bold text-sm pb-2 border-b-2 transition-all ${authMode === 'login' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => setAuthMode('signup')} 
                  className={`flex-1 text-center font-bold text-sm pb-2 border-b-2 transition-all ${authMode === 'signup' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}
                >
                  Register Staff
                </button>
              </div>

              {authMode === 'login' ? (
                <form onSubmit={handleLogin}>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={loginEmail} 
                      onChange={e => setLoginEmail(e.target.value)} 
                      placeholder="e.g. ranakeyur38@gmail.com" 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Password</label>
                    <input 
                      type="password" 
                      required 
                      value={loginPassword} 
                      onChange={e => setLoginPassword(e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs tracking-wide shadow-lg shadow-indigo-600/10 transition-colors"
                  >
                    Authenticate Account
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignup}>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={signupName} 
                      onChange={e => setSignupName(e.target.value)} 
                      placeholder="Keyur Rana" 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={signupEmail} 
                      onChange={e => setSignupEmail(e.target.value)} 
                      placeholder="keyur@example.com" 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Password</label>
                    <input 
                      type="password" 
                      required 
                      value={signupPass} 
                      onChange={e => setSignupPass(e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Department Assignment</label>
                    <select 
                      value={signupDept} 
                      onChange={e => setSignupDept(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4 p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-lg text-[10px] text-indigo-300 font-medium">
                    Security Rule: Public signup registers users into a baseline 'Employee' role only. Elevated roles can only be granted by an administrator.
                  </div>
                  <button 
                    type="submit" 
                    className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs tracking-wide shadow-lg shadow-indigo-600/10 transition-colors"
                  >
                    Complete Registration
                  </button>
                </form>
              )}
            </div>
          )}

          {currentView === 'dashboard' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Operational Overview</h2>
                  <p className="text-xs text-slate-400">Real-time statistics and rapid task management shortcuts.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Available Assets', val: assets.filter(a => a.status === 'AVAILABLE').length, bg: 'bg-slate-800/80' },
                  { label: 'Allocated Assets', val: assets.filter(a => a.status === 'ALLOCATED').length, bg: 'bg-slate-800/80' },
                  { label: 'Maintenance Tasks Today', val: maintenance.filter(m => m.status === 'IN_PROGRESS' || m.status === 'PENDING').length, bg: 'bg-slate-800/80' },
                  { label: 'Active Bookings', val: bookings.filter(b => !b.is_cancelled).length, bg: 'bg-slate-800/80' },
                  { label: 'Pending Transfers', val: transfers.filter(t => t.status === 'REQUESTED').length, bg: 'bg-slate-800/80' },
                ].map((kpi, idx) => (
                  <div key={idx} className={`${kpi.bg} border border-slate-850 p-4 rounded-xl shadow-lg hover:border-slate-700 transition-colors`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-2xl font-black mt-2 text-indigo-300">{kpi.val}</p>
                  </div>
                ))}

                <div className="bg-red-950/60 border border-red-900/60 p-4 rounded-xl shadow-lg relative overflow-hidden">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Overdue Returns</p>
                  <p className="text-2xl font-black mt-2 text-red-200">1</p>
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mt-8 mb-4">Quick Operations Hub</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-200 mb-1.5">Register Asset</h4>
                  <p className="text-[11px] text-slate-400 mb-3">Add a new physical asset category record.</p>
                  <button onClick={() => setCurrentView('directory')} className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-extrabold border border-indigo-500/20 transition-all">Go to Register &rarr;</button>
                </div>
                <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-200 mb-1.5">Book Resource</h4>
                  <p className="text-[11px] text-slate-400 mb-3">Reserve shared vehicles or equipment slots.</p>
                  <button onClick={() => setCurrentView('booking')} className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-extrabold border border-indigo-500/20 transition-all">Go to Bookings &rarr;</button>
                </div>
                <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-200 mb-1.5">Raise Maintenance Ticket</h4>
                  <p className="text-[11px] text-slate-400 mb-3">Report faults on any allocated hardware.</p>
                  <button onClick={() => setCurrentView('maintenance')} className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-extrabold border border-indigo-500/20 transition-all">Go to Tickets &rarr;</button>
                </div>
              </div>
            </div>
          )}

          {currentView === 'organization' && currentUser.role === 'ADMIN' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Organization Setup Console</h2>
                <p className="text-xs text-slate-400">Manage structure, categories, and permissions.</p>
              </div>

              <div className="flex gap-4 border-b border-slate-800 mb-6">
                {[
                  { id: 'departments', label: 'Departments' },
                  { id: 'categories', label: 'Asset Categories' },
                  { id: 'employees', label: 'Employee Directory' }
                ].map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setActiveOrgTab(t.id)} 
                    className={`pb-2 text-xs font-extrabold border-b-2 transition-all ${activeOrgTab === t.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeOrgTab === 'departments' && (
                <div className="bg-slate-800/30 border border-slate-850 p-6 rounded-xl">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Hierarchical Departments Tree</h3>
                  <div className="space-y-4">
                    {departments.filter(d => d.parentId === null).map(parent => (
                      <div key={parent.id} className="border-l-2 border-slate-700 pl-4 space-y-2">
                        <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-lg border border-slate-750">
                          <div>
                            <span className="text-xs font-extrabold text-slate-100">{parent.name}</span>
                            <span className="text-[10px] ml-3 bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full uppercase">Parent Dept</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            Head: {users.find(u => u.id === parent.headId)?.name || 'None Assigned'}
                          </div>
                        </div>
                        {departments.filter(d => d.parentId === parent.id).map(child => (
                          <div key={child.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-800 ml-6">
                            <div>
                              <span className="text-xs font-bold text-slate-300">{child.name}</span>
                              <span className="text-[10px] ml-3 bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full uppercase border border-indigo-900/30">Sub-Dept</span>
                            </div>
                            <div className="text-xs text-slate-400 font-medium">
                              Head: {users.find(u => u.id === child.headId)?.name || 'None Assigned'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeOrgTab === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-2">Category Schemas</h3>
                    {categories.map(c => (
                      <div key={c.id} className="p-4 bg-slate-850/60 border border-slate-800 rounded-xl">
                        <h4 className="text-xs font-extrabold text-indigo-300">{c.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1">{c.description}</p>
                        <div className="mt-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300">
                          {JSON.stringify(c.schema, null, 2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-xl">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Schema Configurator</h3>
                    <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-xs text-indigo-300">
                      <p className="font-extrabold uppercase text-[10px] mb-1">Dynamic Field Configurations</p>
                      Add warranty specifications, serial tags, or license attributes custom schemas per asset category using dynamic JSON inputs.
                    </div>
                  </div>
                </div>
              )}

              {activeOrgTab === 'employees' && (
                <div className="bg-slate-800/30 border border-slate-805 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-850/80 border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-3">Staff Name</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3">Role Designation</th>
                        <th className="p-3 text-right">Promote Authorization</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-800/20">
                          <td className="p-3 font-bold text-slate-200">{u.name}</td>
                          <td className="p-3 text-slate-400 font-medium">{u.email}</td>
                          <td className="p-3">
                            <span className="bg-indigo-950 text-indigo-300 border border-indigo-900/30 px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wide">
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            {u.role === 'EMPLOYEE' && (
                              <>
                                <button onClick={() => handlePromoteRole(u.id, 'ASSET_MANAGER')} className="text-[10px] bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-2 py-1 rounded font-bold hover:bg-indigo-600/30 transition-colors">Make Manager</button>
                                <button onClick={() => handlePromoteRole(u.id, 'DEPARTMENT_HEAD')} className="text-[10px] bg-slate-700 border border-slate-650 text-slate-200 px-2 py-1 rounded font-bold hover:bg-slate-650 transition-colors">Make Head</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {currentView === 'directory' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl lg:col-span-1">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Register Asset Record</h3>
                  <form onSubmit={handleRegisterAsset} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Asset Name</label>
                      <input 
                        type="text" 
                        required 
                        value={regName} 
                        onChange={e => setRegName(e.target.value)} 
                        placeholder="MacBook Pro 16" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Asset Category</label>
                      <select 
                        value={regCat} 
                        onChange={e => setRegCat(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Serial Number</label>
                      <input 
                        type="text" 
                        required 
                        value={regSerial} 
                        onChange={e => setRegSerial(e.target.value)} 
                        placeholder="C02DF124MD6M" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Acquisition Cost ($)</label>
                      <input 
                        type="number" 
                        required 
                        value={regCost} 
                        onChange={e => setRegCost(e.target.value)} 
                        placeholder="2499" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Location Tag</label>
                      <input 
                        type="text" 
                        required 
                        value={regLocation} 
                        onChange={e => setRegLocation(e.target.value)} 
                        placeholder="HQ-Floor 3" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <input 
                        type="checkbox" 
                        checked={regShared} 
                        onChange={e => setRegShared(e.target.checked)} 
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                      />
                      <span className="text-xs font-bold text-slate-300">Is Shared/Bookable Resource</span>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs tracking-wide shadow-lg shadow-indigo-600/10 transition-colors"
                    >
                      Generate &amp; Save Asset
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="flex gap-3 bg-slate-800/20 border border-slate-800 p-4 rounded-xl">
                    <input 
                      type="text" 
                      placeholder="Filter by Tag, Serial, or Name..." 
                      value={dirSearch}
                      onChange={e => setDirSearch(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                    <select 
                      value={dirStatus} 
                      onChange={e => setDirStatus(e.target.value)} 
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="ALLOCATED">Allocated</option>
                      <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                      <option value="LOST">Lost</option>
                    </select>
                  </div>

                  <div className="bg-slate-800/30 border border-slate-805 rounded-xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-850/80 border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          <th className="p-3">Tracking Tag</th>
                          <th className="p-3">Asset Details</th>
                          <th className="p-3">Location</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {assets.filter(a => {
                          const matchesSearch = a.name.toLowerCase().includes(dirSearch.toLowerCase()) || a.tag.toLowerCase().includes(dirSearch.toLowerCase()) || a.serialNumber.toLowerCase().includes(dirSearch.toLowerCase());
                          const matchesStatus = dirStatus === 'ALL' || a.status === dirStatus;
                          return matchesSearch && matchesStatus;
                        }).map(a => (
                          <tr 
                            key={a.id} 
                            onClick={() => setSelectedAsset(a)}
                            className="hover:bg-slate-800/20 cursor-pointer transition-colors"
                          >
                            <td className="p-3 font-mono font-bold text-indigo-400">{a.tag}</td>
                            <td className="p-3">
                              <p className="font-bold text-slate-200">{a.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Serial: {a.serialNumber}</p>
                            </td>
                            <td className="p-3 text-slate-400 font-bold">{a.location}</td>
                            <td className="p-3">
                              <span className={`status-badge ${a.status === 'AVAILABLE' ? 'status-available' : a.status === 'ALLOCATED' ? 'status-allocated' : 'status-maintenance'}`}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {selectedAsset && (
                <div className="fixed inset-y-0 right-0 w-96 bg-slate-850 border-l border-slate-700 shadow-2xl p-6 z-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                      <div>
                        <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block font-mono">{selectedAsset.tag}</span>
                        <h4 className="text-sm font-black text-white mt-1">{selectedAsset.name}</h4>
                      </div>
                      <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-white font-extrabold text-xs">Close</button>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Acquisition Details</span>
                        <p className="text-slate-200">Date: <span className="font-bold">{selectedAsset.acquisitionDate}</span></p>
                        <p className="text-slate-200 mt-0.5">Value: <span className="font-bold">${selectedAsset.cost}</span></p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Active Allocation History</span>
                        {allocations.filter(al => al.assetId === selectedAsset.id).length > 0 ? (
                          <div className="space-y-2 mt-1.5">
                            {allocations.filter(al => al.assetId === selectedAsset.id).map(al => (
                              <div key={al.id} className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                                <p className="font-bold text-slate-200">{users.find(u => u.id === al.userId)?.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">From: {new Date(al.checkedOutAt).toLocaleDateString()} &middot; Return: {al.actualReturnDate || 'Active'}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 font-medium italic mt-1">No checkout logs registered.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedAsset(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs tracking-wide border border-slate-750 transition-colors">Dismiss Drawer</button>
                </div>
              )}
            </div>
          )}

          {currentView === 'allocation' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Asset Checkout &amp; Transfer</h3>
                  <form onSubmit={handleCreateAllocation} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Select Target Asset</label>
                      <select 
                        value={allocAsset} 
                        onChange={e => handleAllocationAssetChange(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        <option value="">Choose Asset...</option>
                        {assets.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.tag}) - {a.status}</option>
                        ))}
                      </select>
                    </div>

                    {allocConflictMsg && (
                      <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl flex items-center justify-between text-xs text-red-300">
                        <div>
                          <p className="font-extrabold uppercase text-[10px] text-red-400">Collision Conflict</p>
                          <p className="font-semibold mt-0.5">{allocConflictMsg}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={handleInitiateTransfer}
                          className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] tracking-wide shadow-lg shadow-red-950 transition-colors"
                        >
                          Request Transfer
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Assignee Staff</label>
                      <select 
                        value={allocUser} 
                        onChange={e => setAllocUser(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Expected Return Date</label>
                      <input 
                        type="date" 
                        value={allocReturn} 
                        onChange={e => setAllocReturn(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    {!allocConflictMsg && (
                      <button 
                        type="submit" 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs tracking-wide shadow-lg shadow-indigo-600/10 transition-colors"
                      >
                        Approve Checkout
                      </button>
                    )}
                  </form>
                </div>

                <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Return Check-in Desk</h3>
                  <form onSubmit={handleProcessReturn} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Return Asset</label>
                      <select 
                        value={returnAssetId} 
                        onChange={e => setReturnAssetId(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        <option value="">Select Borrowed Asset...</option>
                        {assets.filter(a => a.status === 'ALLOCATED').map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Check-in Condition Notes</label>
                      <textarea 
                        value={returnNotes} 
                        onChange={e => setReturnNotes(e.target.value)} 
                        placeholder="Device returned in excellent condition, wiped and cleaned." 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 h-20"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs tracking-wide shadow-lg shadow-indigo-600/10 transition-colors"
                    >
                      Confirm Return Check-in
                    </button>
                  </form>
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-805 rounded-xl p-6">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Transfer Request Management</h3>
                <div className="space-y-3">
                  {transfers.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-slate-850/60 border border-slate-800 rounded-xl">
                      <div>
                        <span className="font-bold text-slate-200 text-xs">Asset Tag: {assets.find(a => a.id === t.assetId)?.tag}</span> &middot; 
                        <span className="text-[11px] text-slate-400 font-medium ml-2">
                          From: {users.find(u => u.id === t.fromUserId)?.name} &rarr; To: {users.find(u => u.id === t.toUserId)?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-900/30 ${t.status === 'REQUESTED' ? 'bg-indigo-950 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                          {t.status}
                        </span>
                        {t.status === 'REQUESTED' && (
                          <button 
                            onClick={() => handleApproveTransfer(t.id)} 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded text-[10px] tracking-wide transition-colors"
                          >
                            Approve Re-allocation
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'booking' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl lg:col-span-1">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Reserve Shared Slots</h3>
                  <form onSubmit={handleCreateBooking} className="space-y-4">
                    {bookError && (
                      <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-xs text-red-300 font-medium">
                        {bookError}
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Select Shared Resource</label>
                      <select 
                        value={bookResource} 
                        onChange={e => setBookResource(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        {assets.filter(a => a.is_shared).map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Start Reservation Time</label>
                      <input 
                        type="datetime-local" 
                        required 
                        value={bookStart} 
                        onChange={e => setBookStart(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">End Reservation Time</label>
                      <input 
                        type="datetime-local" 
                        required 
                        value={bookEnd} 
                        onChange={e => setBookEnd(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs tracking-wide shadow-lg shadow-indigo-600/10 transition-colors"
                    >
                      Book Time Slot
                    </button>
                  </form>
                </div>

                <div className="bg-slate-800/30 border border-slate-805 rounded-xl p-6 lg:col-span-2">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Resource Calendars</h3>
                  <div className="space-y-4">
                    {assets.filter(a => a.is_shared).map(r => (
                      <div key={r.id} className="p-4 bg-slate-850/60 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-extrabold text-xs text-slate-200">{r.name} ({r.tag})</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Shared Resource</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5">
                          {bookings.filter(b => b.resourceId === r.id && !b.is_cancelled).map(b => (
                            <div key={b.id} className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs">
                              <div>
                                <span className="font-bold text-slate-300">Reserved by {users.find(u => u.id === b.userId)?.name}</span>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  {new Date(b.startTime).toLocaleString()} &mdash; {new Date(b.endTime).toLocaleString()}
                                </p>
                              </div>
                              <span className="bg-indigo-950 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-indigo-900/30 uppercase tracking-wide">Reserved Slot</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'maintenance' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl lg:col-span-1">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Submit Fault Report</h3>
                  <form onSubmit={handleRaiseMaintenance} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Target Hardware</label>
                      <select 
                        value={maintAsset} 
                        onChange={e => setMaintAsset(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        {assets.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Hardware Breakdown Description</label>
                      <textarea 
                        required
                        value={maintDesc} 
                        onChange={e => setMaintDesc(e.target.value)} 
                        placeholder="Describe screen flickering, system crashes, or physical defects..." 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 h-24"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Priority Flag</label>
                      <select 
                        value={maintPriority} 
                        onChange={e => setMaintPriority(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs tracking-wide shadow-lg shadow-indigo-600/10 transition-colors"
                    >
                      File Fault Report
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-4 bg-slate-800/30 border border-slate-805 p-6 rounded-2xl">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Asset Manager Pipeline Workspace</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['PENDING', 'APPROVED', 'RESOLVED'].map(col => (
                      <div key={col} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">{col} Pipeline</h4>
                        <div className="space-y-3">
                          {maintenance.filter(m => m.status === col).map(ticket => {
                            const assetItem = assets.find(a => a.id === ticket.assetId);
                            return (
                              <div key={ticket.id} className="p-3 bg-slate-850 border border-slate-800 rounded-lg space-y-2">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-mono font-bold text-indigo-400">{assetItem ? assetItem.tag : ''}</span>
                                  <span className={`px-2 py-0.5 rounded font-extrabold uppercase ${ticket.priority === 'High' ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-slate-400'}`}>
                                    {ticket.priority}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-200">{assetItem ? assetItem.name : ''}</p>
                                <p className="text-[11px] text-slate-400 font-medium">{ticket.description}</p>
                                
                                <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-800 text-[10px] font-bold">
                                  {col === 'PENDING' && (
                                    <button 
                                      onClick={() => handleUpdateMaintenanceStatus(ticket.id, 'APPROVED')} 
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {col === 'APPROVED' && (
                                    <button 
                                      onClick={() => handleUpdateMaintenanceStatus(ticket.id, 'RESOLVED')} 
                                      className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded"
                                    >
                                      Resolve Fault
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'audit' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl lg:col-span-1">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Stock check configuration</h3>
                  <form onSubmit={e => e.preventDefault()} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Target Scope Location</label>
                      <input 
                        type="text" 
                        required 
                        value={auditPlanLocation} 
                        onChange={e => setAuditPlanLocation(e.target.value)} 
                        placeholder="e.g. HQ-Floor 3" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Appointed Auditor</label>
                      <select 
                        value={auditPlanAuditor} 
                        onChange={e => setAuditPlanAuditor(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="button" 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs tracking-wide shadow-lg shadow-indigo-600/10 transition-colors"
                    >
                      Initiate Audit Cycle
                    </button>
                  </form>

                  {auditReport && (
                    <div className="mt-6 p-4 bg-slate-850 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wide border-b border-slate-800 pb-1.5">Cycle Discrepancy Report</h4>
                      <p className="text-xs text-slate-300 font-bold">Total Scanned: {auditReport.total}</p>
                      <div className="space-y-1.5 text-[11px] text-slate-400 font-medium">
                        <p>Verified Assets: <span className="text-green-400 font-bold">{auditReport.verified.join(', ') || 'None'}</span></p>
                        <p>Damaged Assets: <span className="text-yellow-400 font-bold">{auditReport.damaged.join(', ') || 'None'}</span></p>
                        <p>Missing (Shifted to Lost): <span className="text-red-400 font-bold">{auditReport.missing.join(', ') || 'None'}</span></p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 space-y-4 bg-slate-800/30 border border-slate-805 p-6 rounded-2xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-2">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider m-0">Auditor Inspection Desk</h3>
                    {!auditCycles[0].isClosed && (
                      <button 
                        onClick={() => handleCloseAuditCycle(1)} 
                        className="bg-red-800 hover:bg-red-700 text-red-200 border border-red-900 font-extrabold px-3 py-1.5 rounded-lg text-xs tracking-wide shadow-lg transition-colors"
                      >
                        Close Audit Cycle
                      </button>
                    )}
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-850/80 border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-3">Asset Item</th>
                        <th className="p-3">Inspection Status</th>
                        <th className="p-3 text-right">Verification Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {auditEntries.map(entry => {
                        const assetObj = assets.find(a => a.id === entry.assetId);
                        return (
                          <tr key={entry.id} className="hover:bg-slate-800/20">
                            <td className="p-3 font-bold text-slate-200">{assetObj ? assetObj.name : ''}</td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-905/30 ${entry.status === 'VERIFIED' ? 'bg-green-950 text-green-300' : entry.status === 'MISSING' ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-slate-400'}`}>
                                {entry.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1.5">
                              {!auditCycles[0].isClosed && (
                                <>
                                  <button onClick={() => handleUpdateAuditStatus(entry.id, 'VERIFIED')} className="text-[10px] bg-green-600/20 border border-green-500/30 text-green-300 px-2 py-0.5 rounded hover:bg-green-600/30 transition-colors">Verify</button>
                                  <button onClick={() => handleUpdateAuditStatus(entry.id, 'MISSING')} className="text-[10px] bg-red-600/20 border border-red-500/30 text-red-300 px-2 py-0.5 rounded hover:bg-red-600/30 transition-colors">Flag Missing</button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentView === 'reports' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl lg:col-span-1 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-2">Custom Report Builder</h3>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Export Scope</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500">
                      <option value="ALL">All Categories</option>
                      <option value="1">Electronics</option>
                      <option value="2">Furniture</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider">Date Parameters</label>
                    <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                  </div>
                  
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs tracking-wide transition-colors">Export PDF Report</button>
                    <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs tracking-wide border border-slate-750 transition-colors">Export CSV Data</button>
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-slate-800/30 border border-slate-805 p-6 rounded-2xl">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Operational Efficiency Insights</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Utilization Rates</span>
                        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: '74%' }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-indigo-300">
                          <span>74% Allocated Pool</span>
                          <span>26% Shelf Capacity</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resource Allocation Heatmaps</span>
                        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-purple-300">
                          <span>85% Peak Allocation Times</span>
                          <span>15% Off-Peak Duration</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'logs' && (
            <div className="space-y-6">
              <div className="bg-slate-800/30 border border-slate-805 p-6 rounded-2xl">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0 mb-4">Real-time System Logs</h3>
                <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-850/80 border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Executing Operator</th>
                        <th className="p-3">Target Asset</th>
                        <th className="p-3">Event Action details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-800/20">
                          <td className="p-3 text-indigo-400 font-bold">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-3 text-slate-200">@{log.username}</td>
                          <td className="p-3 text-indigo-300">{log.targetTag}</td>
                          <td className="p-3 text-slate-400">{log.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
