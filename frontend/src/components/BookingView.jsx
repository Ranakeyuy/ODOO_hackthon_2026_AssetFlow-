import React, { useState } from 'react';
import { INPUT_CLS, LABEL_CLS, BTN_PRIMARY, Card, PageHeader, AlertBanner } from './ui';

const BOOKING_COLORS = [
  'bg-indigo-600/80 border-indigo-500/60',
  'bg-purple-600/80 border-purple-500/60',
  'bg-emerald-600/80 border-emerald-500/60',
  'bg-amber-600/80 border-amber-500/60',
  'bg-rose-600/80 border-rose-500/60',
];

export default function BookingView({ assets, bookings, users, currentUser, onCreateBooking, onCancelBooking }) {
  const [resource, setResource] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookError, setBookError] = useState(null);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

  const sharedAssets = assets.filter(a => a.is_shared);

  const handleSubmit = (e) => {
    e.preventDefault();
    setBookError(null);
    setBookSuccess(false);

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setBookError('Start time must be strictly before end time.');
      return;
    }

    if (start < new Date()) {
      setBookError('Booking start time cannot be set in the past.');
      return;
    }

    const overlap = bookings.find(b =>
      b.resourceId === parseInt(resource) &&
      !b.is_cancelled &&
      new Date(b.startTime) < end &&
      new Date(b.endTime) > start
    );

    if (overlap) {
      const holder = users.find(u => u.id === overlap.userId);
      setBookError(`Time Slot Overlap Conflict: This resource is already reserved from ${new Date(overlap.startTime).toLocaleTimeString()} to ${new Date(overlap.endTime).toLocaleTimeString()} by ${holder?.name || 'another user'}.`);
      return;
    }

    onCreateBooking({ resourceId: parseInt(resource), startTime, endTime });
    setBookSuccess(true);
    setStartTime(''); setEndTime('');
    setTimeout(() => setBookSuccess(false), 4000);
  };

  const getUser = (id) => users.find(u => u.id === id);
  const getDayBookings = (resourceId) => bookings.filter(b => b.resourceId === resourceId && !b.is_cancelled);

  const formatTime = (dt) => new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (dt) => new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-8">
      <PageHeader title="Resource Booking Engine" subtitle="Reserve shared assets with real-time overlap collision detection." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="p-6 lg:col-span-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-5">Reserve Time Slot</p>

          {bookError && (
            <div className="mb-4">
              <AlertBanner type="error" message={bookError} onDismiss={() => setBookError(null)} />
            </div>
          )}
          {bookSuccess && (
            <div className="mb-4">
              <AlertBanner type="success" message="Time slot successfully reserved. Booking confirmed." />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLS}>Shared Resource</label>
              <select required value={resource} onChange={e => setResource(e.target.value)} className={INPUT_CLS}>
                <option value="">Choose resource...</option>
                {sharedAssets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Start Date & Time</label>
              <input type="datetime-local" required value={startTime} onChange={e => setStartTime(e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>End Date & Time</label>
              <input type="datetime-local" required value={endTime} onChange={e => setEndTime(e.target.value)} className={INPUT_CLS} />
            </div>

            {startTime && endTime && new Date(startTime) < new Date(endTime) && resource && (() => {
              const start = new Date(startTime);
              const end = new Date(endTime);
              const durationMs = end - start;
              const hours = Math.floor(durationMs / 3600000);
              const mins = Math.floor((durationMs % 3600000) / 60000);
              return (
                <div className="p-3 bg-slate-800/60 border border-slate-700/40 rounded-xl">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Booking Summary</p>
                  <p className="text-xs font-bold text-slate-200">Duration: {hours}h {mins}m</p>
                  <p className="text-[10px] text-slate-400 font-medium">{formatDate(startTime)} · {formatTime(startTime)} → {formatTime(endTime)}</p>
                </div>
              );
            })()}

            <button type="submit" disabled={!resource || !startTime || !endTime} className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}>
              Confirm Reservation
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Overlap Detection Logic</p>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <p className="text-[10px] font-mono text-indigo-300 leading-relaxed">
                start_time &lt; existing_end<br />
                <span className="text-slate-500">&& </span>end_time &gt; existing_start<br />
                <span className="text-slate-500">&& </span>!is_cancelled
              </p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Resource Booking Calendars</p>
          {sharedAssets.map((r, ri) => {
            const resourceBookings = getDayBookings(r.id);
            return (
              <div key={r.id} className="bg-slate-800/30 border border-slate-700/60 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <div>
                      <p className="text-xs font-extrabold text-white">{r.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium font-mono">{r.tag} · {r.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                      {resourceBookings.length} booking{resourceBookings.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {resourceBookings.length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <p className="text-xs text-slate-500 font-medium">No active bookings. Resource is fully available.</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2.5">
                    {resourceBookings.map((b, bi) => {
                      const u = getUser(b.userId);
                      const colorCls = BOOKING_COLORS[bi % BOOKING_COLORS.length];
                      const isPast = new Date(b.endTime) < new Date();
                      return (
                        <div key={b.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${isPast ? 'bg-slate-800/40 border-slate-700/40 opacity-60' : colorCls}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-extrabold text-white">
                              {u?.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-white">{u?.name}</p>
                              <p className="text-[10px] text-white/70 font-medium">
                                {formatDate(b.startTime)} · {formatTime(b.startTime)} — {formatTime(b.endTime)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${isPast ? 'bg-slate-700 text-slate-400' : 'bg-white/20 text-white'}`}>
                              {isPast ? 'Completed' : 'Active'}
                            </span>
                            {!isPast && b.userId === currentUser.id && (
                              <button
                                onClick={() => onCancelBooking(b.id)}
                                className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-800/40 hover:bg-red-800/60 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
