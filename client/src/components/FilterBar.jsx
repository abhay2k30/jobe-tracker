const STATUSES = ['Applied', 'In Review', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];
const SOURCES = ['LinkedIn', 'Naukri', 'Internshala', 'Wellfound', 'Greenhouse', 'Lever', 'Manual'];

export default function FilterBar({ filters, onChange }) {
  function set(key, value) { onChange({ ...filters, [key]: value }); }
  return (
    <div className="flex flex-wrap gap-2.5 mb-5">
      <input
        type="text"
        placeholder="Search company or role…"
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
        className="flex-1 min-w-48 px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all placeholder:text-stone-300"
      />
      <select value={filters.status} onChange={(e) => set('status', e.target.value)}
        className="px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all text-stone-700">
        <option value="">All Statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filters.source} onChange={(e) => set('source', e.target.value)}
        className="px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all text-stone-700">
        <option value="">All Sources</option>
        {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}
