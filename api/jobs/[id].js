import { connectDB } from '../_lib/mongodb.js';
import Job from '../_lib/Job.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  const decoded = requireAuth(req, res);
  if (!decoded) return;

  const { id } = req.query;
  if (!id?.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).json({ error: 'Invalid job ID' });

  await connectDB();

  // PATCH /api/jobs/:id — update fields
  if (req.method === 'PATCH') {
    try {
      const allowed = ['status', 'notes', 'company', 'role', 'url', 'source'];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      if (Object.keys(updates).length === 0)
        return res.status(400).json({ error: 'No valid fields to update' });

      // Reset stale flag when status is updated so user can be reminded again later
      if (updates.status) updates.staleSent = false;

      const job = await Job.findOneAndUpdate(
        { _id: id, userId: decoded.userId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!job) return res.status(404).json({ error: 'Job not found' });
      return res.status(200).json({ job });
    } catch (err) {
      console.error('PATCH /jobs/:id error:', err);
      return res.status(500).json({ error: 'Failed to update job' });
    }
  }

  // DELETE /api/jobs/:id
  if (req.method === 'DELETE') {
    try {
      const job = await Job.findOneAndDelete({ _id: id, userId: decoded.userId });
      if (!job) return res.status(404).json({ error: 'Job not found' });
      return res.status(200).json({ message: 'Deleted' });
    } catch (err) {
      console.error('DELETE /jobs/:id error:', err);
      return res.status(500).json({ error: 'Failed to delete job' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
