import { useState, useEffect } from 'react';

const STATUSES = ['Applied', 'In Review', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];
const SOURCES = ['LinkedIn', 'Naukri', 'Internshala', 'Wellfound', 'Greenhouse', 'Lever', 'Manual'];
const EMPTY = { company: '', role: '', url: '', status: 'Applied', source: 'Manual', notes: '', appliedAt: '' };

export default function AddJobModal({ onAdd, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  function set(e) { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); setError(''); }

  async function handleSubmit() {
    if (!form.company || !form.role || !form.url) {
      setError('Company, role, and URL are required.'); return;
    }
    setLoading(true);
    const result = await onAdd(form);
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-300 transition-all placeholder:text-stone-300";
  const labelCls = "block text-xs font-medium text-stone-500 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-stone-100">
        <h2 className="font-semibold text-stone-900 mb-5">Add Application</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Company *</label>
            <input name="company" value={form.company} onChange={set} placeholder="Acme Corp" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Role *</label>
            <input name="role" value={form.role} onChange={set} placeholder="Software Engineer" className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Job URL *</label>
            <input name="url" type="url" value={form.url} onChange={set} placeholder="https://..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select name="status" value={form.status} onChange={set} className={inputCls}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Source</label>
            <select name="source" value={form.source} onChange={set} className={inputCls}>
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Applied Date</label>
            <input type="date" name="appliedAt" value={form.appliedAt} onChange={set} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={set} rows={3} maxLength={2000}
              placeholder="Any notes about this application…"
              className={`${inputCls} resize-none`} />
          </div>
        </div>
        {error && <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors">
            {loading ? 'Adding…' : 'Add Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
