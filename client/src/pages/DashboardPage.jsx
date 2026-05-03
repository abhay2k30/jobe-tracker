import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';
import FilterBar from '../components/FilterBar.jsx';
import JobTable from '../components/JobTable.jsx';
import EditModal from '../components/EditModal.jsx';
import AddJobModal from '../components/AddJobModal.jsx';

const STATUS_STATS = [
  { label: 'Total', key: 'total', color: 'bg-stone-100 text-stone-700' },
  { label: 'Applied', key: 'Applied', color: 'bg-blue-50 text-blue-700' },
  { label: 'In Review', key: 'In Review', color: 'bg-amber-50 text-amber-700' },
  { label: 'Interview', key: 'Interview', color: 'bg-violet-50 text-violet-700' },
  { label: 'Offer', key: 'Offer', color: 'bg-emerald-50 text-emerald-700' },
  { label: 'Rejected', key: 'Rejected', color: 'bg-red-50 text-red-600' },
];

async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', source: '', search: '' });
  const [editingJob, setEditingJob] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchJobs = useCallback(async (f) => {
    setLoading(true); setError('');
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v))).toString();
    const { ok, data } = await apiFetch(`/jobs/index${qs ? `?${qs}` : ''}`);
    if (ok) setJobs(data.jobs || []);
    else setError('Failed to load applications.');
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(filters); }, []); // eslint-disable-line

  function handleFilterChange(f) { setFilters(f); fetchJobs(f); }

  async function handleStatusChange(id, status) {
    const { ok, data } = await apiFetch(`/jobs/${id}`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    });
    if (ok) setJobs((p) => p.map((j) => j._id === id ? data.job : j));
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this application?')) return;
    const { ok } = await apiFetch(`/jobs/${id}`, { method: 'DELETE' });
    if (ok) setJobs((p) => p.filter((j) => j._id !== id));
  }

  async function handleSaveNotes(notes) {
    const { ok, data } = await apiFetch(`/jobs/${editingJob._id}`, {
      method: 'PATCH', body: JSON.stringify({ notes }),
    });
    if (ok) setJobs((p) => p.map((j) => j._id === editingJob._id ? data.job : j));
    setEditingJob(null);
  }

  async function handleAddJob(jobData) {
    const { ok, status, data } = await apiFetch('/jobs/index', {
      method: 'POST', body: JSON.stringify(jobData),
    });
    if (ok) { setJobs((p) => [data.job, ...p]); setShowAdd(false); return {}; }
    if (status === 409) return { error: 'This URL is already logged.' };
    return { error: data.error || 'Failed to add job.' };
  }

  const counts = jobs.reduce((a, j) => ({ ...a, [j.status]: (a[j.status] || 0) + 1 }), {});

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-semibold text-stone-900 tracking-tight">Job Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500 hidden sm:block">{user?.name}</span>
          <button
            onClick={() => setShowAdd(true)}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Job
          </button>
          <button onClick={logout} className="text-sm text-stone-400 hover:text-red-500 transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {STATUS_STATS.map(({ label, key, color }) => (
            <div key={key} className={`rounded-xl px-4 py-3 ${color}`}>
              <p className="text-2xl font-semibold font-['DM_Mono'] tabular-nums">
                {key === 'total' ? jobs.length : (counts[key] || 0)}
              </p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
            </div>
          ))}
        </div>

        <FilterBar filters={filters} onChange={handleFilterChange} />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
          </div>
        ) : (
          <JobTable
            jobs={jobs}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onEditNotes={setEditingJob}
          />
        )}
      </div>

      {editingJob && (
        <EditModal job={editingJob} onSave={handleSaveNotes} onClose={() => setEditingJob(null)} />
      )}
      {showAdd && (
        <AddJobModal onAdd={handleAddJob} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
