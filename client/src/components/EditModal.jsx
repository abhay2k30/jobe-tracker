import { useState, useEffect } from 'react';

export default function EditModal({ job, onSave, onClose }) {
  const [notes, setNotes] = useState(job.notes || '');

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-stone-100">
        <h2 className="font-semibold text-stone-900 mb-0.5">Edit Notes</h2>
        <p className="text-sm text-stone-400 mb-4">{job.company} — {job.role}</p>
        <textarea
          autoFocus value={notes} onChange={(e) => setNotes(e.target.value)}
          maxLength={2000} rows={6} placeholder="Notes about this application…"
          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 resize-none transition-all"
        />
        <p className="text-xs text-stone-300 text-right mt-1">{notes.length}/2000</p>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(notes)}
            className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors">
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}
