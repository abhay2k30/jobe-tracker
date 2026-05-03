const STATUSES = ['Applied', 'In Review', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

const STATUS_STYLE = {
  Applied: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Review': 'bg-amber-50 text-amber-700 border-amber-200',
  Interview: 'bg-violet-50 text-violet-700 border-violet-200',
  Offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-600 border-red-200',
  Withdrawn: 'bg-stone-100 text-stone-500 border-stone-200',
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function JobRow({ job, onStatusChange, onDelete, onEditNotes }) {
  const style = STATUS_STYLE[job.status] || STATUS_STYLE.Withdrawn;
  return (
    <tr className="hover:bg-stone-50/60 transition-colors group">
      <td className="px-4 py-3 max-w-[160px]">
        <span className="block truncate text-sm font-medium text-stone-800" title={job.company}>{job.company}</span>
      </td>
      <td className="px-4 py-3 max-w-[180px]">
        <span className="block truncate text-sm text-stone-500" title={job.role}>{job.role}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{job.source}</span>
      </td>
      <td className="px-4 py-3">
        <select
          value={job.status}
          onChange={(e) => onStatusChange(job._id, e.target.value)}
          className={`text-xs border rounded-full px-2.5 py-1 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-900/10 ${style}`}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
      <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap font-['DM_Mono']">{fmtDate(job.appliedAt)}</td>
      <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap font-['DM_Mono']">{fmtDate(job.lastUpdated)}</td>
      <td className="px-4 py-3 max-w-[200px]">
        <button
          onClick={() => onEditNotes(job)}
          className="text-left w-full hover:text-blue-600 transition-colors"
          title="Click to edit"
        >
          {job.notes
            ? <span className="block truncate text-xs text-stone-500">{job.notes}</span>
            : <span className="text-xs text-stone-300 italic">Add note…</span>
          }
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
          <a href={job.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline whitespace-nowrap">
            View ↗
          </a>
          <button onClick={() => onDelete(job._id)}
            className="text-xs text-stone-400 hover:text-red-500 transition-colors whitespace-nowrap">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
