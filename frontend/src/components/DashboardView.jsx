import React from 'react';
import { KpiCard, Card, PageHeader } from './ui';

const QUICK_ACTIONS = [
  {
    icon: 'M12 4v16m8-8H4',
    label: 'Register Asset',
    desc: 'Add a new physical asset to the master inventory with auto-generated tracking tag.',
    view: 'directory',
    color: 'from-indigo-600/20 to-indigo-600/5 border-indigo-700/40',
    iconBg: 'bg-indigo-600/20 text-indigo-400',
  },
  {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    label: 'Book Resource',
    desc: 'Reserve shared vehicles, meeting rooms, or specialized equipment time slots.',
    view: 'booking',
    color: 'from-purple-600/20 to-purple-600/5 border-purple-700/40',
    iconBg: 'bg-purple-600/20 text-purple-400',
  },
  {
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    label: 'Raise Maintenance Ticket',
    desc: 'Report hardware faults, breakdowns, or physical damage on allocated assets.',
    view: 'maintenance',
    color: 'from-amber-600/20 to-amber-600/5 border-amber-700/40',
    iconBg: 'bg-amber-600/20 text-amber-400',
  },
  {
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    label: 'Initiate Transfer',
    desc: 'Request asset reallocation between staff members with approval workflow.',
    view: 'allocation',
    color: 'from-emerald-600/20 to-emerald-600/5 border-emerald-700/40',
    iconBg: 'bg-emerald-600/20 text-emerald-400',
  },
];

export default function DashboardView({ assets, allocations, bookings, transfers, maintenance, logs, setCurrentView, currentUser }) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const available = assets.filter(a => a.status === 'AVAILABLE').length;
  const allocated = assets.filter(a => a.status === 'ALLOCATED').length;
  const underMaintenance = assets.filter(a => a.status === 'UNDER_MAINTENANCE').length;
  const activeBookings = bookings.filter(b => !b.is_cancelled && new Date(b.endTime) > now).length;
  const pendingTransfers = transfers.filter(t => t.status === 'REQUESTED').length;
  const overdueReturns = allocations.filter(al => al.actualReturnDate === null && al.expectedReturnDate && al.expectedReturnDate < today);

  const recentLogs = logs.slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Good ${now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'}, ${currentUser.name.split(' ')[0]}`}
        subtitle={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · AssetFlow Operational Dashboard`}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Available Assets" value={available} sub={`${assets.length} total assets`} />
        <KpiCard label="Allocated Assets" value={allocated} sub="Active checkouts" />
        <KpiCard label="Under Maintenance" value={underMaintenance} sub="In service queue" />
        <KpiCard label="Active Bookings" value={activeBookings} sub="Upcoming slots" />
        <KpiCard label="Pending Transfers" value={pendingTransfers} sub="Awaiting approval" />
        <KpiCard label="Overdue Returns" value={overdueReturns.length} accent="danger" pulse={overdueReturns.length > 0} sub="Past deadline" />
      </div>

      {overdueReturns.length > 0 && (
        <Card className="p-5 border-red-900/50 bg-red-950/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-400">Critical Alert — Overdue Asset Returns</p>
          </div>
          <div className="space-y-2.5">
            {overdueReturns.map(al => {
              const asset = assets.find(a => a.id === al.assetId);
              const user = null;
              const daysOverdue = Math.floor((new Date() - new Date(al.expectedReturnDate)) / (1000 * 60 * 60 * 24));
              return (
                <div key={al.id} className="flex items-center justify-between p-3 bg-red-950/40 border border-red-900/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-red-300">{asset?.tag}</span>
                    <div>
                      <p className="text-xs font-bold text-red-200">{asset?.name}</p>
                      <p className="text-[10px] text-red-400/70 font-medium">Expected: {al.expectedReturnDate}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-red-300 bg-red-900/40 px-2.5 py-1 rounded-full border border-red-800/50">
                    {daysOverdue}d overdue
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">Quick Operations Hub</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={() => setCurrentView(action.view)}
              className={`text-left p-5 rounded-2xl border bg-gradient-to-br ${action.color} hover:scale-[1.02] transition-all group`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${action.iconBg}`}>
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.icon} />
                </svg>
              </div>
              <p className="text-xs font-extrabold text-white mb-1">{action.label}</p>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">Asset Status Distribution</p>
          <Card className="p-5">
            <div className="space-y-3">
              {[
                { label: 'Available', count: available, total: assets.length, color: 'bg-emerald-500' },
                { label: 'Allocated', count: allocated, total: assets.length, color: 'bg-indigo-500' },
                { label: 'Under Maintenance', count: underMaintenance, total: assets.length, color: 'bg-orange-500' },
                { label: 'Reserved', count: assets.filter(a => a.status === 'RESERVED').length, total: assets.length, color: 'bg-amber-500' },
                { label: 'Retired / Disposed', count: assets.filter(a => a.status === 'RETIRED' || a.status === 'DISPOSED').length, total: assets.length, color: 'bg-slate-600' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 w-36 shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-700`}
                      style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-300 w-6 text-right tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">Recent Activity Feed</p>
          <Card className="p-4">
            <div className="space-y-3">
              {recentLogs.map((log, i) => {
                const typeColors = {
                  MAINTENANCE_REQUEST: 'text-amber-400',
                  TRANSFER_REQUEST: 'text-indigo-400',
                  MAINTENANCE_APPROVED: 'text-orange-400',
                  TRANSFER_APPROVED: 'text-emerald-400',
                  ALLOCATION_OPEN: 'text-indigo-400',
                  ALLOCATION_CLOSE: 'text-slate-400',
                  STATE_CHANGE: 'text-purple-400',
                  MAINTENANCE_RESOLVED: 'text-emerald-400',
                };
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-300 font-medium leading-relaxed truncate">{log.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-extrabold uppercase ${typeColors[log.actionType] || 'text-slate-500'}`}>{log.actionType.replace(/_/g, ' ')}</span>
                        <span className="text-[9px] text-slate-600">·</span>
                        <span className="text-[9px] text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setCurrentView('logs')} className="w-full mt-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors text-center pt-3 border-t border-slate-800">
              View Full Audit Trail →
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
