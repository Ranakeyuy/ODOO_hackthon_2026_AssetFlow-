import React, { useState } from 'react';
import { INPUT_CLS, LABEL_CLS, BTN_PRIMARY, AlertBanner } from './ui';

export default function AuthScreen({ departments, onLogin, onSignup }) {
  const [mode, setMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('ranakeyur38@gmail.com');
  const [loginPassword, setLoginPassword] = useState('password');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupDept, setSignupDept] = useState('1');
  const [signupPhone, setSignupPhone] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail || !loginPassword) {
      setError('Please enter your email and password.');
      return;
    }
    onLogin(loginEmail);
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setError(null);
    if (signupPass !== signupConfirm) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (signupPass.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    onSignup({ name: signupName, email: signupEmail, password: signupPass, departmentId: parseInt(signupDept), phone: signupPhone });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 60% 20%, #1e1b4b 0%, #0f172a 60%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">AssetFlow</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Enterprise Asset & Resource Management Platform</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="flex border-b border-slate-800">
            {[{ id: 'login', label: 'Sign In' }, { id: 'signup', label: 'Register Staff' }].map(t => (
              <button
                key={t.id}
                onClick={() => { setMode(t.id); setError(null); }}
                className={`flex-1 py-3.5 text-xs font-extrabold tracking-wide transition-all ${
                  mode === t.id
                    ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500'
                    : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-7">
            {error && (
              <div className="mb-5">
                <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={LABEL_CLS}>Email Address</label>
                  <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@assetflow.io" className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Password</label>
                  <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" className={INPUT_CLS} />
                </div>
                <div className="pt-1">
                  <button type="submit" className={BTN_PRIMARY}>
                    Authenticate & Enter Platform
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 text-center font-medium">
                    Demo: Use <span className="text-indigo-400 font-bold">ranakeyur38@gmail.com</span> to login as Admin
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={LABEL_CLS}>Full Name</label>
                    <input type="text" required value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="Priya Sharma" className={INPUT_CLS} />
                  </div>
                  <div className="col-span-2">
                    <label className={LABEL_CLS}>Work Email Address</label>
                    <input type="email" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="priya@assetflow.io" className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Password</label>
                    <input type="password" required value={signupPass} onChange={e => setSignupPass(e.target.value)} placeholder="Min. 8 chars" className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Confirm Password</label>
                    <input type="password" required value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} placeholder="Repeat password" className={INPUT_CLS} />
                  </div>
                  <div className="col-span-2">
                    <label className={LABEL_CLS}>Phone Number</label>
                    <input type="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} placeholder="+91 98765 43210" className={INPUT_CLS} />
                  </div>
                  <div className="col-span-2">
                    <label className={LABEL_CLS}>Department Assignment</label>
                    <select value={signupDept} onChange={e => setSignupDept(e.target.value)} className={INPUT_CLS.replace('text-white', 'text-white')}>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider mb-0.5">Security Governance Rule</p>
                      <p className="text-[10px] text-indigo-300/70 font-medium leading-relaxed">
                        All public registrations are automatically assigned the baseline <strong className="text-indigo-300">Employee</strong> role. Elevated roles (Asset Manager, Department Head, Admin) can only be granted by a system administrator.
                      </p>
                    </div>
                  </div>
                </div>

                <button type="submit" className={BTN_PRIMARY}>
                  Complete Staff Registration
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6 font-medium">
          AssetFlow Enterprise ERP · v2.4.1 · © 2026 AssetFlow Inc.
        </p>
      </div>
    </div>
  );
}
