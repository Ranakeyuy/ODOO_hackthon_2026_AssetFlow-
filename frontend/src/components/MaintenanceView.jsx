import React, { useState } from 'react';
import { INPUT_CLS, LABEL_CLS, BTN_PRIMARY, Card, PageHeader, StatusBadge, PriorityBadge, AlertBanner } from './ui';

const PIPELINE_STAGES = [
  { id: 'PENDING', label: 'Pending', color: 'border-amber-800/40 bg-amber-950/10' },
  { id: 'APPROVED', label: 'Approved', color: 'border-indigo-800/40 bg-indigo-950/10' },
  { id: 'TECHNICIAN_ASSIGNED', label: 'Tech Assigned', color: 'border-purple-800/40 bg-purple-950/10' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-800/40 bg-blue-950/10' },
  { id: 'RESOLVED', label: 'Resolved', color: 'border-emerald-800/40 bg-emerald-950/10' },
];

export default function MaintenanceView({ assets, users, maintenance, currentUser, onRaiseMaintenance, onUpdateStatus }) {
  const [assetId, setAssetId] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [techAssignments, setTechAssignments] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onRaiseMaintenance({ assetId: parseInt(assetId), description: desc, priority, requestedById: currentUser.id });
    setAssetId(''); setDesc(''); setPriority('Medium');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const handleAssignAndApprove = (ticketId) => {
    const techId = techAssignments[ticketId];
    if (!techId) return;
    onUpdateStatus(ticketId, 'APPROVED', techId);
  };

  const getAsset = (id) => assets.find(a => a.id === id);
  const getUser = (id) => users.find(u => u.id === id);

  const eligibleAssets = assets.filter(a => !['RETIRED', 'DISPOSED', 'LOST'].includes(a.status));

  return (
    <div className="space-y-8">
      <PageHeader title="Maintenance Management Portal" subtitle="Submit fault reports and manage the repair pipeline." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="p-6 lg:col-span-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-5">Submit Fault Report</p>

          {submitted && (
            <div className="mb-4">
              <AlertBanner type="success" message="Maintenance ticket filed successfully. Asset Manager will review shortly." />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLS}>Target Hardware</label>
              <select required value={assetId} onChange={e => setAssetId(e.target.value)} className={INPUT_CLS}>
                <option value="">Select asset...</option>
                {eligibleAssets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag}) — {a.status.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Fault Description</label>
              <textarea
                required
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Describe the hardware breakdown, error messages, or physical damage in detail..."
                className={`${INPUT_CLS} h-28 resize-none`}
              />
              {desc.length > 0 && desc.length < 10 && (
                <p className="text-[10px] text-red-400 font-medium mt-1">Minimum 10 characters required.</p>
              )}
            </div>
            <div>
              <label className={LABEL_CLS}>Priority Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['Low', 'Medium', 'High'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-lg text-xs font-extrabold border transition-all ${
                      priority === p
                        ? p === 'High' ? 'bg-red-600/30 border-red-500/60 text-red-300' :
                          p === 'Medium' ? 'bg-amber-600/30 border-amber-500/60 text-amber-300' :
                          'bg-slate-700 border-slate-600 text-slate-200'
                        : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>Attach Evidence (Optional)</label>
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-indigo-600/40 transition-colors cursor-pointer">
                <svg className="w-6 h-6 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-[10px] text-slate-500 font-medium">Drop files or click to upload</p>
                <p className="text-[9px] text-slate-600 font-medium mt-0.5">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>
            <button type="submit" disabled={!assetId || desc.length < 10} className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}>
              File Fault Report
            </button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">Asset Manager Pipeline Workspace</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {PIPELINE_STAGES.map(stage => {
              const tickets = maintenance.filter(m => m.status === stage.id);
              return (
                <div key={stage.id} className={`rounded-2xl border p-4 ${stage.color}`}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{stage.label}</p>
                    <span className="text-[9px] font-extrabold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                      {tickets.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tickets.length === 0 && (
                      <p className="text-[10px] text-slate-600 font-medium text-center py-4">No tickets</p>
                    )}
                    {tickets.map(ticket => {
                      const asset = getAsset(ticket.assetId);
                      const requester = getUser(ticket.requestedById);
                      return (
                        <div key={ticket.id} className="bg-slate-900/80 border border-slate-800/60 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-mono text-[10px] font-extrabold text-indigo-400">{asset?.tag}</p>
                              <p className="text-xs font-extrabold text-white mt-0.5">{asset?.name}</p>
                            </div>
                            <PriorityBadge priority={ticket.priority} />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-3">{ticket.description}</p>
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[8px] font-extrabold text-white">
                              {requester?.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <p className="text-[9px] text-slate-500 font-medium">{requester?.name}</p>
                            <span className="text-[9px] text-slate-600 ml-auto">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>

                          {stage.id === 'PENDING' && (
                            <div className="pt-2 border-t border-slate-800/60 space-y-2">
                              <select
                                value={techAssignments[ticket.id] || ''}
                                onChange={e => setTechAssignments({ ...techAssignments, [ticket.id]: e.target.value })}
                                className={`${INPUT_CLS} text-[10px] py-1.5`}
                              >
                                <option value="">Assign technician...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </select>
                              <button
                                onClick={() => handleAssignAndApprove(ticket.id)}
                                disabled={!techAssignments[ticket.id]}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold py-1.5 rounded-lg text-[10px] tracking-wide transition-all"
                              >
                                Approve & Assign
                              </button>
                            </div>
                          )}
                          {stage.id === 'APPROVED' && (
                            <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                              <button
                                onClick={() => onUpdateStatus(ticket.id, 'TECHNICIAN_ASSIGNED')}
                                className="w-full bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-extrabold py-1.5 rounded-lg text-[10px] tracking-wide border border-purple-700/40 transition-all"
                              >
                                Mark Tech Assigned
                              </button>
                            </div>
                          )}
                          {stage.id === 'TECHNICIAN_ASSIGNED' && (
                            <div className="pt-2 border-t border-slate-800/60">
                              <button
                                onClick={() => onUpdateStatus(ticket.id, 'IN_PROGRESS')}
                                className="w-full bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-extrabold py-1.5 rounded-lg text-[10px] tracking-wide border border-blue-700/40 transition-all"
                              >
                                Start Work
                              </button>
                            </div>
                          )}
                          {stage.id === 'IN_PROGRESS' && (
                            <div className="pt-2 border-t border-slate-800/60">
                              <button
                                onClick={() => onUpdateStatus(ticket.id, 'RESOLVED')}
                                className="w-full bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-extrabold py-1.5 rounded-lg text-[10px] tracking-wide border border-emerald-700/40 transition-all"
                              >
                                Mark Resolved
                              </button>
                            </div>
                          )}
                          {stage.id === 'RESOLVED' && ticket.resolvedAt && (
                            <p className="text-[9px] text-emerald-400/60 font-medium pt-1 border-t border-slate-800/60">
                              Resolved: {new Date(ticket.resolvedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
