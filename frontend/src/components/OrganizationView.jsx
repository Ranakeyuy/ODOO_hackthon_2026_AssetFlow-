import React, { useState } from 'react';
import { INPUT_CLS, SELECT_CLS, LABEL_CLS, BTN_PRIMARY, Card, PageHeader, TabBar, RoleBadge, DataTable, Modal, AlertBanner } from './ui';

function DepartmentsTab({ departments, users, onCreateDept }) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [headId, setHeadId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateDept({ name, parentId: parentId ? parseInt(parentId) : null, headId: headId ? parseInt(headId) : null });
    setName(''); setParentId(''); setHeadId('');
  };

  const topLevel = departments.filter(d => d.parentId === null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Organizational Hierarchy Tree</p>
        <div className="space-y-3">
          {topLevel.map(parent => {
            const children = departments.filter(d => d.parentId === parent.id);
            const head = users.find(u => u.id === parent.headId);
            return (
              <div key={parent.id} className="border border-slate-700/60 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 bg-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">{parent.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Head: {head ? head.name : 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">Root Dept</span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${parent.isActive ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {parent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="border-t border-slate-800 divide-y divide-slate-800/60">
                    {children.map(child => {
                      const childHead = users.find(u => u.id === child.headId);
                      return (
                        <div key={child.id} className="flex items-center justify-between px-5 py-3 pl-12 bg-slate-900/40 hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-indigo-600/40 rounded-full"></div>
                            <div>
                              <p className="text-xs font-bold text-slate-200">{child.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">Head: {childHead ? childHead.name : 'Unassigned'}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">Sub-Dept</span>
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

      <Card className="p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-5">Create Department</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLS}>Department Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sales Division" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Parent Department</label>
            <select value={parentId} onChange={e => setParentId(e.target.value)} className={INPUT_CLS}>
              <option value="">None (Top Level)</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Department Head</label>
            <select value={headId} onChange={e => setHeadId(e.target.value)} className={INPUT_CLS}>
              <option value="">Assign Later</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <button type="submit" className={BTN_PRIMARY}>Create Department Branch</button>
        </form>
      </Card>
    </div>
  );
}

function CategoriesTab({ categories, onCreateCategory }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedCat, setSelectedCat] = useState(categories[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateCategory({ name, description: desc });
    setName(''); setDesc('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">Category Schema Registry</p>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c)}
            className={`w-full text-left p-5 rounded-2xl border transition-all ${selectedCat?.id === c.id ? 'border-indigo-600/60 bg-indigo-950/20' : 'border-slate-700/60 bg-slate-800/30 hover:border-slate-600/60'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-extrabold text-white">{c.name}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{c.description}</p>
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {Object.keys(c.schema).length} fields
              </span>
            </div>
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Dynamic Schema Fields</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(c.schema).map(([key, type]) => (
                  <div key={key} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-2.5 py-1.5">
                    <span className="text-[10px] font-bold text-slate-300">{key}</span>
                    <span className="text-[9px] font-extrabold text-indigo-400 uppercase">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Card className="p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-5">Define New Category</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLS}>Category Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Medical Equipment" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Description</label>
            <textarea required value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe this asset category..." className={`${INPUT_CLS} h-20 resize-none`} />
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Default Schema Fields</p>
            <p className="text-[10px] text-slate-400 font-medium">New categories are initialized with a default schema. Custom fields can be added via the API.</p>
          </div>
          <button type="submit" className={BTN_PRIMARY}>Register Category</button>
        </form>
      </Card>
    </div>
  );
}

function EmployeeDirectoryTab({ users, departments, currentUser, onPromoteRole }) {
  const [promoteModal, setPromoteModal] = useState(null);
  const [selectedRole, setSelectedRole] = useState('ASSET_MANAGER');

  const getDept = (id) => departments.find(d => d.id === id)?.name || 'Unassigned';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Staff Directory — {users.length} Members</p>
      </div>

      <DataTable
        columns={[
          { label: 'Staff Member', key: 'name', render: row => (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-extrabold text-white shrink-0">
                {row.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-bold text-slate-200 text-xs">{row.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">{row.email}</p>
              </div>
            </div>
          )},
          { label: 'Department', key: 'departmentId', render: row => <span className="text-xs text-slate-400 font-medium">{getDept(row.departmentId)}</span> },
          { label: 'Role', key: 'role', render: row => <RoleBadge role={row.role} /> },
          { label: 'Joined', key: 'joinDate', render: row => <span className="text-[10px] text-slate-500 font-medium">{row.joinDate}</span> },
          { label: 'Actions', align: 'right', render: row => (
            row.id !== currentUser.id && row.role === 'EMPLOYEE' ? (
              <button
                onClick={() => setPromoteModal(row)}
                className="text-[10px] bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg font-extrabold hover:bg-indigo-600/30 transition-colors"
              >
                Promote Role
              </button>
            ) : row.id === currentUser.id ? (
              <span className="text-[10px] text-slate-600 font-medium">Current User</span>
            ) : (
              <span className="text-[10px] text-slate-600 font-medium">Elevated</span>
            )
          )},
        ]}
        rows={users}
      />

      <Modal open={!!promoteModal} onClose={() => setPromoteModal(null)} title="Promote Staff Role">
        {promoteModal && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-extrabold text-white">
                {promoteModal.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">{promoteModal.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">{promoteModal.email}</p>
              </div>
            </div>
            <AlertBanner type="warning" message="Role promotions are permanent until manually changed by an Admin. This action will be logged in the system audit trail." />
            <div>
              <label className={LABEL_CLS}>Assign New Role</label>
              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className={INPUT_CLS}>
                <option value="ASSET_MANAGER">Asset Manager</option>
                <option value="DEPARTMENT_HEAD">Department Head</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { onPromoteRole(promoteModal.id, selectedRole); setPromoteModal(null); }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs tracking-wide transition-all"
              >
                Confirm Promotion
              </button>
              <button onClick={() => setPromoteModal(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs border border-slate-700 transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function OrganizationView({ departments, users, categories, currentUser, onCreateDept, onCreateCategory, onPromoteRole }) {
  const [activeTab, setActiveTab] = useState('departments');

  return (
    <div>
      <PageHeader title="Organization Setup Console" subtitle="Manage departments, asset categories, and staff role governance." />
      <TabBar
        tabs={[
          { id: 'departments', label: 'Departments' },
          { id: 'categories', label: 'Asset Categories' },
          { id: 'employees', label: 'Employee Directory' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === 'departments' && <DepartmentsTab departments={departments} users={users} onCreateDept={onCreateDept} />}
      {activeTab === 'categories' && <CategoriesTab categories={categories} onCreateCategory={onCreateCategory} />}
      {activeTab === 'employees' && <EmployeeDirectoryTab users={users} departments={departments} currentUser={currentUser} onPromoteRole={onPromoteRole} />}
    </div>
  );
}
