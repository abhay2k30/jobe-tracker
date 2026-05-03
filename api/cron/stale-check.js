import { connectDB } from '../_lib/mongodb.js';
import Job from '../_lib/Job.js';
import User from '../_lib/User.js';
import { sendStaleEmail } from '../_lib/resend.js';

export default async function handler(req, res) {
  // Vercel cron calls this with Authorization: Bearer <CRON_SECRET>
  // This prevents anyone else from triggering the cron manually
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await connectDB();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find jobs that are Applied/In Review, not updated in 7 days, email not yet sent
    const staleJobs = await Job.find({
      status: { $in: ['Applied', 'In Review'] },
      lastUpdated: { $lt: sevenDaysAgo },
      staleSent: false,
    }).lean();

    if (staleJobs.length === 0) {
      return res.status(200).json({ message: 'No stale jobs found', emailsSent: 0 });
    }

    // Group stale jobs by userId
    const byUser = staleJobs.reduce((acc, job) => {
      const uid = job.userId.toString();
      if (!acc[uid]) acc[uid] = [];
      acc[uid].push(job);
      return acc;
    }, {});

    // Fetch all affected users in one query
    const users = await User.find({ _id: { $in: Object.keys(byUser) } }).lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    let emailsSent = 0;
    let errors = 0;

    for (const [uid, jobs] of Object.entries(byUser)) {
      const user = userMap[uid];
      if (!user) continue;

      try {
        await sendStaleEmail(user.email, user.name, jobs);

        // Mark these jobs so we don't email again until status changes
        await Job.updateMany(
          { _id: { $in: jobs.map((j) => j._id) } },
          { $set: { staleSent: true } }
        );

        emailsSent++;
      } catch (emailErr) {
        console.error(`Email failed for user ${uid}:`, emailErr.message);
        errors++;
      }
    }

    return res.status(200).json({
      message: `Processed ${Object.keys(byUser).length} users`,
      staleJobCount: staleJobs.length,
      emailsSent,
      errors,
    });
  } catch (err) {
    console.error('Cron error:', err);
    return res.status(500).json({ error: 'Cron job failed' });
  }
}
