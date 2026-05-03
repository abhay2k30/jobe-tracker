import { clearAuthCookie, requireAuth } from '../_lib/auth.js';
export default async function handler(req, res) {
  if (req.method === 'POST') {
    clearAuthCookie(res);
    return res.status(200).json({ message: 'Logged out' });
  }

  if (req.method === 'GET') {
    const decoded = requireAuth(req, res);
    if (!decoded) return;
    return res.status(200).json({
      user: { id: decoded.userId, name: decoded.name, email: decoded.email },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
