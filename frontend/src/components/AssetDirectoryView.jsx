import React, { useState } from 'react';
import { INPUT_CLS, LABEL_CLS, BTN_PRIMARY, BTN_GHOST, Card, PageHeader, StatusBadge, Drawer, AlertBanner } from './ui';

const STATUS_OPTIONS = ['ALL', 'AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'];

export default function AssetDirectoryView({ assets, categories, allocations, users, onRegisterAsset, onUpdateAsset }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [regName, setRegName] = useState('');
  const [regCat, setRegCat] = useState('1');
  const [regSerial, setRegSerial] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regShared, setRegShared] = useState(false);
  const [regCost, setRegCost] = useState('');
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regCondition, setRegCondition] = useState('Excellent');
  const [lastTag, setLastTag] = useState(null);

  const [editLocation, setEditLocation] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editCost, setEditCost] = useState('');

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q) || a.serialNumber.toLowerCase().includes(q) || a.location.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchCat = categoryFilter === 'ALL' || a.categoryId === parseInt(categoryFilter);
    return matchSearch && matchStatus && matchCat;
  });

  const handleRegister = (e) => {
    e.preventDefault();
    const tag = onRegisterAsset({ name: regName, categoryId: parseInt(regCat), serialNumber: regSerial, location: regLocation, is_shared: regShared, cost: parseFloat(regCost) || 0, acquisitionDate: regDate, condition: regCondition });
    setLastTag(tag);
    setRegName(''); setRegSerial(''); setRegLocation(''); setRegCost('');
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    onUpdateAsset(selectedAsset.id, { location: editLocation, condition: editCondition, cost: parseFloat(editCost) });
    setEditMode(false);
  };

  const openDrawer = (asset) => {
    setSelectedAsset(asset);
    setEditLocation(asset.location);
    setEditCondition(asset.condition);
    setEditCost(asset.cost.toString());
    setEditMode(false);
  };

  const getCatName = (id) => categories.find(c => c.id === id)?.name || 'Unknown';
  const getAssetAllocations = (assetId) => allocations.filter(al => al.assetId === assetId);

  return (
    <div>
      <PageHeader title="Asset Directory & Registration" subtitle="Register new assets and manage the complete inventory lifecycle." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="p-6 lg:col-span-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-5">Register New Asset</p>

          {lastTag && (
            <div className="mb-4 p-3.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl flex items-center gap-3">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">Asset Registered</p>
                <p className="text-xs font-black text-emerald-200 font-mono">{lastTag}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className={LABEL_CLS}>Asset Name</label>
              <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} placeholder="MacBook Pro 16&quot;" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Category</label>
              <select value={regCat} onChange={e => setRegCat(e.target.value)} className={INPUT_CLS}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Serial Number</label>
              <input type="text" required value={regSerial} onChange={e => setRegSerial(e.target.value)} placeholder="C02DF124MD6M" className={INPUT_CLS} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Acquisition Cost ($)</label>
                <input type="number" required value={regCost} onChange={e => setRegCost(e.target.value)} placeholder="2499" className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Acquisition Date</label>
                <input type="date" value={regDate} onChange={e => setRegDate(e.target.value)} className={INPUT_CLS} />
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>Location Tag</label>
              <input type="text" required value={regLocation} onChange={e => setRegLocation(e.target.value)} placeholder="HQ-Floor 3, Desk 14" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Current Condition</label>
              <select value={regCondition} onChange={e => setRegCondition(e.target.value)} className={INPUT_CLS}>
                {['Excellent', 'Good', 'Fair', 'Poor'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <div
                onClick={() => setRegShared(!regShared)}
                className={`relative w-10 h-5 rounded-full transition-colors ${regShared ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${regShared ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs font-bold text-slate-300">Shared / Bookable Resource</span>
            </label>
            <button type="submit" className={BTN_PRIMARY}>Generate Tag & Save Asset</button>
          </form>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-3 p-4 bg-slate-800/30 border border-slate-700/60 rounded-2xl">
            <input
              type="text"
              placeholder="Search by tag, serial, name, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`${INPUT_CLS} flex-1 min-w-48`}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${INPUT_CLS} w-auto`}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={`${INPUT_CLS} w-auto`}>
              <option value="ALL">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/60 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Master Inventory — {filtered.length} records
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Tag', 'Asset Details', 'Category', 'Location', 'Condition', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map(a => (
                    <tr key={a.id} onClick={() => openDrawer(a)} className="cursor-pointer hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-extrabold text-indigo-400 text-[11px]">{a.tag}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-200">{a.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium font-mono">{a.serialNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-medium">{getCatName(a.categoryId)}</td>
                      <td className="px-4 py-3 text-slate-400 font-medium">{a.location}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          a.condition === 'Excellent' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' :
                          a.condition === 'Good' ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40' :
                          a.condition === 'Fair' ? 'bg-amber-950/60 text-amber-300 border-amber-800/40' :
                          'bg-red-950/60 text-red-300 border-red-800/40'
                        }`}>{a.condition}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-500 font-medium">No assets match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedAsset && (
        <div className="fixed inset-0 z-40" onClick={() => setSelectedAsset(null)} />
      )}
      <Drawer
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset?.name || ''}
        subtitle={selectedAsset?.tag}
      >
        {selectedAsset && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Status', value: <StatusBadge status={selectedAsset.status} /> },
                { label: 'Category', value: getCatName(selectedAsset.categoryId) },
                { label: 'Serial Number', value: <span className="font-mono text-[11px]">{selectedAsset.serialNumber}</span> },
                { label: 'Acquisition Date', value: selectedAsset.acquisitionDate },
                { label: 'Valuation', value: `$${selectedAsset.cost.toLocaleString()}` },
                { label: 'Shared Resource', value: selectedAsset.is_shared ? 'Yes' : 'No' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/40">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{item.label}</p>
                  <div className="text-xs font-bold text-slate-200">{item.value}</div>
                </div>
              ))}
            </div>

            {Object.keys(selectedAsset.attributes || {}).length > 0 && (
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Category Attributes</p>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
                  {Object.entries(selectedAsset.attributes).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">{k}</span>
                      <span className="text-[10px] font-extrabold text-slate-200">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Checkout History</p>
              {getAssetAllocations(selectedAsset.id).length > 0 ? (
                <div className="space-y-2">
                  {getAssetAllocations(selectedAsset.id).map(al => {
                    const u = users.find(u => u.id === al.userId);
                    return (
                      <div key={al.id} className="p-3 bg-slate-800/60 border border-slate-700/40 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-slate-200">{u?.name || 'Unknown'}</p>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${al.actualReturnDate ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40'}`}>
                            {al.actualReturnDate ? 'Returned' : 'Active'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Out: {new Date(al.checkedOutAt).toLocaleDateString()} · Return: {al.actualReturnDate || 'Pending'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium italic">No checkout history recorded.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Edit Configuration</p>
                <button onClick={() => setEditMode(!editMode)} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                  {editMode ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editMode && (
                <form onSubmit={handleUpdate} className="space-y-3">
                  <div>
                    <label className={LABEL_CLS}>Location</label>
                    <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Condition</label>
                    <select value={editCondition} onChange={e => setEditCondition(e.target.value)} className={INPUT_CLS}>
                      {['Excellent', 'Good', 'Fair', 'Poor'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Valuation Cost ($)</label>
                    <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)} className={INPUT_CLS} />
                  </div>
                  <button type="submit" className={BTN_PRIMARY}>Save Changes</button>
                </form>
              )}
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
