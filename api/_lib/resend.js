import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM || 'Job Tracker <notifications@yourdomain.com>';
const APP_URL = process.env.APP_URL || 'https://your-app.vercel.app';

export async function sendStaleEmail(userEmail, userName, jobs) {
  const jobRows = jobs
    .map(
      (j) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${j.company}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${j.role}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#888">
            ${new Date(j.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </td>
        </tr>`
    )
    .join('');

  const { error } = await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: `${jobs.length} application${jobs.length > 1 ? 's' : ''} need your attention`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;color:#1a1a1a">
        <h2 style="margin:0 0 8px">Applications needing attention</h2>
        <p style="color:#555;margin:0 0 24px">Hi ${userName}, these applications haven't been updated in over 7 days:</p>
        <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#f0f0f0">
              <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#555">Company</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#555">Role</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#555">Applied</th>
            </tr>
          </thead>
          <tbody>${jobRows}</tbody>
        </table>
        <div style="margin-top:24px">
          <a href="${APP_URL}/dashboard" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;font-weight:500">
            Update your applications →
          </a>
        </div>
        <p style="margin-top:32px;font-size:12px;color:#aaa">You're receiving this because you have a Job Tracker account.</p>
      </div>
    `,
    text: `Hi ${userName},\n\nThese applications haven't been updated in over 7 days:\n\n${jobs.map((j) => `• ${j.company} — ${j.role}`).join('\n')}\n\nLog in to update:\n${APP_URL}/dashboard`,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
