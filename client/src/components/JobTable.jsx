import JobRow from './JobRow.jsx';

const HEADERS = ['Company', 'Role', 'Source', 'Status', 'Applied', 'Last Updated', 'Notes', 'Actions'];

export default function JobTable({ jobs, onStatusChange, onDelete, onEditNotes }) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 text-stone-400 text-sm">
        <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        No applications yet. Hit <strong>+ Add Job</strong> to get started.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-stone-100">
        <thead className="bg-stone-50">
          <tr>
            {HEADERS.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {jobs.map((job) => (
            <JobRow key={job._id} job={job}
              onStatusChange={onStatusChange} onDelete={onDelete} onEditNotes={onEditNotes} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
