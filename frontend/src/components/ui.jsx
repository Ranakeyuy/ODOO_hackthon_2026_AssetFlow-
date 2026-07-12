import React from 'react';

export const INPUT_CLS = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors';
export const SELECT_CLS = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors';
export const LABEL_CLS = 'block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 tracking-wider';
export const BTN_PRIMARY = 'w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs tracking-wide shadow-lg shadow-indigo-600/20 transition-all';
export const BTN_GHOST = 'w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs tracking-wide border border-slate-700 transition-all';
export const CARD_CLS = 'bg-slate-800/40 border border-slate-700/60 rounded-2xl';
export const SECTION_TITLE = 'text-[10px] font-extrabold uppercase tracking-widest text-slate-400';

export function Label({ children }) {
  return <label className={LABEL_CLS}>{children}</label>;
}

export function SectionTitle({ children, className = '' }) {
  return <p className={`${SECTION_TITLE} ${className}`}>{children}</p>;
}

export function Card({ children, className = '' }) {
  return <div className={`${CARD_CLS} ${className}`}>{children}</div>;
}

export function StatusBadge({ status }) {
  const map = {
    AVAILABLE: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50',
    ALLOCATED: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/50',
    RESERVED: 'bg-amber-950/80 text-amber-300 border-amber-800/50',
    UNDER_MAINTENANCE: 'bg-orange-950/80 text-orange-300 border-orange-800/50',
    LOST: 'bg-red-950/80 text-red-300 border-red-800/50',
    RETIRED: 'bg-slate-800 text-slate-400 border-slate-700',
    DISPOSED: 'bg-slate-900 text-slate-500 border-slate-800',
    PENDING: 'bg-amber-950/80 text-amber-300 border-amber-800/50',
    APPROVED: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50',
    REQUESTED: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/50',
    REJECTED: 'bg-red-950/80 text-red-300 border-red-800/50',
    RESOLVED: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50',
    TECHNICIAN_ASSIGNED: 'bg-purple-950/80 text-purple-300 border-purple-800/50',
    IN_PROGRESS: 'bg-blue-950/80 text-blue-300 border-blue-800/50',
    VERIFIED: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50',
    MISSING: 'bg-red-950/80 text-red-300 border-red-800/50',
    DAMAGED: 'bg-orange-950/80 text-orange-300 border-orange-800/50',
  };
  const cls = map[status] || 'bg-slate-800 text-slate-400 border-slate-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function RoleBadge({ role }) {
  const map = {
    ADMIN: 'bg-purple-950/80 text-purple-300 border-purple-800/50',
    ASSET_MANAGER: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/50',
    DEPARTMENT_HEAD: 'bg-amber-950/80 text-amber-300 border-amber-800/50',
    EMPLOYEE: 'bg-slate-800 text-slate-400 border-slate-700',
  };
  const cls = map[role] || 'bg-slate-800 text-slate-400 border-slate-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${cls}`}>
      {role.replace(/_/g, ' ')}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    High: 'bg-red-950/80 text-red-300 border-red-800/50',
    Medium: 'bg-amber-950/80 text-amber-300 border-amber-800/50',
    Low: 'bg-slate-800 text-slate-400 border-slate-700',
  };
  const cls = map[priority] || 'bg-slate-800 text-slate-400 border-slate-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${cls}`}>
      {priority}
    </span>
  );
}

export function EmptyState({ icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <div className="text-4xl mb-3 opacity-30">{icon}</div>
      <p className="text-xs font-semibold">{message}</p>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-black tracking-tight text-white mb-0.5">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-slate-800 mb-6">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all -mb-px ${
            active === t.id
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} bg-slate-850 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden`} style={{ background: '#0f172a' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-black text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, subtitle, children }) {
  return (
    <div className={`fixed inset-y-0 right-0 z-50 flex transition-all duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="w-[420px] bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col h-full">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-sm font-black text-white">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 mt-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>
      </div>
    </div>
  );
}

export function AlertBanner({ type, message, onDismiss }) {
  const map = {
    error: 'bg-red-950/60 border-red-800/60 text-red-300',
    warning: 'bg-amber-950/60 border-amber-800/60 text-amber-300',
    success: 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300',
    info: 'bg-indigo-950/60 border-indigo-800/60 text-indigo-300',
  };
  const icons = {
    error: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs font-medium ${map[type]}`}>
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icons[type]} />
      </svg>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function KpiCard({ label, value, sub, accent, pulse }) {
  if (accent === 'danger') {
    return (
      <div className="bg-red-950/50 border border-red-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-red-700/60 transition-all">
        {pulse && (
          <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
        <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black mt-2 text-red-200 tabular-nums">{value}</p>
        {sub && <p className="text-[10px] text-red-400/70 font-semibold mt-1">{sub}</p>}
      </div>
    );
  }
  return (
    <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl shadow-lg group hover:border-indigo-700/40 hover:bg-slate-800/70 transition-all">
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black mt-2 text-indigo-300 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 font-semibold mt-1">{sub}</p>}
    </div>
  );
}

export function DataTable({ columns, rows, onRowClick, emptyMessage = 'No records found.' }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/60 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-700/60">
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-xs text-slate-500 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-700/30' : 'hover:bg-slate-800/20'}`}
                >
                  {columns.map((col, j) => (
                    <td key={j} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
