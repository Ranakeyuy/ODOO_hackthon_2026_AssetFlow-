import React, { useState } from 'react';
import { INPUT_CLS, LABEL_CLS, BTN_PRIMARY, Card, PageHeader, StatusBadge, AlertBanner, DataTable } from './ui';

export default function AllocationView({ assets, users, allocations, transfers, currentUser, onCreateAllocation, onInitiateTransfer, onApproveTransfer, onRejectTransfer, onProcessReturn }) {
  const [allocAsset, setAllocAsset] = useState('');
  const [allocUser, setAllocUser] = useState('');
  const [allocReturn, setAllocReturn] = useState('');
  const [conflictMsg, setConflictMsg] = useState(null);
  const [conflictHolder, setConflictHolder] = useState(null);

  const [returnAssetId, setReturnAssetId] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  const handleAssetChange = (assetId) => {
    setAllocAsset(assetId);
    if (!assetId) { setConflictMsg(null); setConflictHolder(null); return; }
    const target = assets.find(a => a.id === parseInt(assetId));
    if (target && target.status !== 'AVAILABLE') {
      const activeAlloc = allocations.find(al => al.assetId === target.id && al.actualReturnDate === null);
      let holder = 'an unidentified user';
      if (activeAlloc) {
        const u = users.find(u => u.id === activeAlloc.userId);
        if (u) holder = u.name;
      }
      setConflictMsg(`Asset '${target.tag}' is not available for allocation.`);
      setConflictHolder(holder);
    } else {
      setConflictMsg(null);
      setConflictHolder(null);
    }
  };

  const handleAllocation = (e) => {
    e.preventDefault();
    if (conflictMsg) return;
    onCreateAllocation({ assetId: parseInt(allocAsset), userId: parseInt(allocUser), expectedReturnDate: allocReturn });
    setAllocAsset(''); setAllocUser(''); setAllocReturn('');
  };

  const handleTransfer = () => {
    onInitiateTransfer({ assetId: parseInt(allocAsset), toUserId: parseInt(allocUser) });
    setAllocAsset(''); setConflictMsg(null); setConflictHolder(null);
  };

  const handleReturn = (e) => {
    e.preventDefault();
    if (!returnAssetId) return;
    onProcessReturn({ assetId: parseInt(returnAssetId), notes: returnNotes });
    setReturnAssetId(''); setReturnNotes('');
  };

  const allocatedAssets = assets.filter(a => a.status === 'ALLOCATED');
  const pendingTransfers = transfers.filter(t => t.status === 'REQUESTED');
  const approvedTransfers = transfers.filter(t => t.status !== 'REQUESTED');

  const getAsset = (id) => assets.find(a => a.id === id);
  const getUser = (id) => users.find(u => u.id === id);

  return (
    <div className="space-y-8">
      <PageHeader title="Asset Allocation & Transfer" subtitle="Manage checkouts, transfers, and return processing." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-5">New Asset Checkout</p>
          <form onSubmit={handleAllocation} className="space-y-4">
            <div>
              <label className={LABEL_CLS}>Select Asset</label>
              <select value={allocAsset} onChange={e => handleAssetChange(e.target.value)} className={INPUT_CLS}>
                <option value="">Choose asset...</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag}) — {a.status.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {conflictMsg && conflictHolder && (
              <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider mb-0.5">Allocation Conflict Detected</p>
                    <p className="text-xs text-red-300 font-medium">{conflictMsg}</p>
                    <p className="text-xs text-red-300/80 font-medium mt-0.5">Currently held by <strong className="text-red-200">{conflictHolder}</strong></p>
                  </div>
                </div>
                <div className="pt-2 border-t border-red-900/40">
                  <p className="text-[10px] text-red-400/70 font-medium mb-2">Select a recipient to initiate a transfer request:</p>
                  <select value={allocUser} onChange={e => setAllocUser(e.target.value)} className={`${INPUT_CLS} mb-2`}>
                    <option value="">Choose transfer recipient...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={handleTransfer}
                    disabled={!allocUser}
                    className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold py-2 rounded-lg text-xs tracking-wide transition-all"
                  >
                    Initiate Transfer Request
                  </button>
                </div>
              </div>
            )}

            {!conflictMsg && (
              <>
                <div>
                  <label className={LABEL_CLS}>Assign To Staff Member</label>
                  <select value={allocUser} onChange={e => setAllocUser(e.target.value)} required className={INPUT_CLS}>
                    <option value="">Choose employee...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Expected Return Date (Optional)</label>
                  <input type="date" value={allocReturn} onChange={e => setAllocReturn(e.target.value)} className={INPUT_CLS} />
                </div>
                <button type="submit" disabled={!allocAsset || !allocUser} className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}>
                  Approve Checkout
                </button>
              </>
            )}
          </form>
        </Card>

        <Card className="p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-5">Return Check-in Desk</p>
          <form onSubmit={handleReturn} className="space-y-4">
            <div>
              <label className={LABEL_CLS}>Select Asset to Return</label>
              <select value={returnAssetId} onChange={e => setReturnAssetId(e.target.value)} className={INPUT_CLS}>
                <option value="">Choose allocated asset...</option>
                {allocatedAssets.map(a => {
                  const alloc = allocations.find(al => al.assetId === a.id && al.actualReturnDate === null);
                  const holder = alloc ? getUser(alloc.userId)?.name : 'Unknown';
                  return <option key={a.id} value={a.id}>{a.name} ({a.tag}) — held by {holder}</option>;
                })}
              </select>
            </div>
            {returnAssetId && (() => {
              const alloc = allocations.find(al => al.assetId === parseInt(returnAssetId) && al.actualReturnDate === null);
              const asset = getAsset(parseInt(returnAssetId));
              const holder = alloc ? getUser(alloc.userId) : null;
              return alloc ? (
                <div className="p-3.5 bg-slate-800/60 border border-slate-700/40 rounded-xl space-y-1.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active Allocation Details</p>
                  <p className="text-xs text-slate-300 font-medium">Holder: <strong className="text-white">{holder?.name}</strong></p>
                  <p className="text-xs text-slate-400 font-medium">Checked out: {new Date(alloc.checkedOutAt).toLocaleDateString()}</p>
                  {alloc.expectedReturnDate && (
                    <p className={`text-xs font-medium ${alloc.expectedReturnDate < new Date().toISOString().split('T')[0] ? 'text-red-400' : 'text-slate-400'}`}>
                      Expected return: {alloc.expectedReturnDate} {alloc.expectedReturnDate < new Date().toISOString().split('T')[0] ? '⚠ Overdue' : ''}
                    </p>
                  )}
                </div>
              ) : null;
            })()}
            <div>
              <label className={LABEL_CLS}>Check-in Condition Notes</label>
              <textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)} placeholder="Device returned in excellent condition, fully wiped and cleaned..." className={`${INPUT_CLS} h-24 resize-none`} />
            </div>
            <button type="submit" disabled={!returnAssetId} className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}>
              Confirm Return & Reset Status
            </button>
          </form>
        </Card>
      </div>

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">Transfer Request Pipeline</p>
        {pendingTransfers.length === 0 && approvedTransfers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-xs text-slate-500 font-medium">No transfer requests on record.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {transfers.map(t => {
              const asset = getAsset(t.assetId);
              const fromUser = getUser(t.fromUserId);
              const toUser = getUser(t.toUserId);
              return (
                <div key={t.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  t.status === 'REQUESTED' ? 'bg-indigo-950/20 border-indigo-800/40' :
                  t.status === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-800/40' :
                  'bg-slate-800/30 border-slate-700/40'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-mono text-xs font-extrabold text-indigo-400">{asset?.tag}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{asset?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="text-center">
                        <p className="font-bold text-slate-300">{fromUser?.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">From</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <div className="text-center">
                        <p className="font-bold text-slate-300">{toUser?.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">To</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={t.status} />
                    {t.status === 'REQUESTED' && (
                      <div className="flex gap-2">
                        <button onClick={() => onApproveTransfer(t.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] tracking-wide transition-all">
                          Approve
                        </button>
                        <button onClick={() => onRejectTransfer(t.id)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-extrabold px-3 py-1.5 rounded-lg text-[10px] tracking-wide border border-slate-600 transition-all">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
