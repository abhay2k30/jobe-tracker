import { connectDB } from '../../_lib/mongodb.js';
import Job from '../../_lib/Job.js';
import { requireAuth } from '../../_lib/auth.js';

export default async function handler(req, res) {
  const decoded = requireAuth(req, res);
  if (!decoded) return;

  await connectDB();

  // GET /api/jobs — list with optional filters
  if (req.method === 'GET') {
    try {
      const { status, source, search, sort = 'appliedAt', order = 'desc' } = req.query;

      const query = { userId: decoded.userId };
      if (status) query.status = status;
      if (source) query.source = source;
      if (search) {
        query.$or = [
          { company: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } },
        ];
      }

      const jobs = await Job.find(query)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .lean();

      return res.status(200).json({ jobs });
    } catch (err) {
      console.error('GET /jobs error:', err);
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  }

  // POST /api/jobs — create
  if (req.method === 'POST') {
    try {
      const { company, role, url, status, source, notes, appliedAt } = req.body;

      if (!company || !role || !url)
        return res.status(400).json({ error: 'company, role, and url are required' });

      // Prevent duplicate by URL per user
      const existing = await Job.findOne({ userId: decoded.userId, url });
      if (existing) return res.status(409).json({ error: 'Already logged', job: existing });

      const job = await Job.create({
        userId: decoded.userId,
        company,
        role,
        url,
        status: status || 'Applied',
        source: source || 'Manual',
        notes: notes || '',
        appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
      });

      return res.status(201).json({ job });
    } catch (err) {
      console.error('POST /jobs error:', err);
      return res.status(500).json({ error: 'Failed to create job' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
