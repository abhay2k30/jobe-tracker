// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Replace with your deployed Vercel URL after deployment
const API_BASE = 'https://jobe-tracker.vercel.app';

// ─── Listen for messages from content scripts / popup ─────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG_JOB') {
    handleLogJob(message.payload);
  }

  if (message.type === 'GET_JOBS') {
    fetchJobs().then(sendResponse);
    return true; // keep channel open for async
  }

  if (message.type === 'UPDATE_JOB') {
    updateJob(message.jobId, message.updates).then(sendResponse);
    return true;
  }

  if (message.type === 'DELETE_JOB') {
    deleteJob(message.jobId).then(sendResponse);
    return true;
  }

  if (message.type === 'LOGIN') {
    login(message.email, message.password).then(sendResponse);
    return true;
  }

  if (message.type === 'LOGOUT') {
    chrome.storage.local.remove(['token', 'user']);
    sendResponse({ success: true });
  }
});

// ─── Get stored auth token ─────────────────────────────────────────────────
async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token'], (result) => resolve(result.token || null));
  });
}

// ─── Login ─────────────────────────────────────────────────────────────────
async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    await chrome.storage.local.set({ token: data.token, user: data.user });
    return { success: true, user: data.user };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// ─── Log a job application ─────────────────────────────────────────────────
async function handleLogJob(payload) {
  const token = await getToken();

  if (!token) {
    chrome.notifications.create('not-logged-in', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Job Tracker',
      message: 'Please log in via the extension popup to track applications.',
      priority: 2,
    });
    return;
  }

  try {
    // Extension uses Bearer token (not cookies) since it's a different origin
    const res = await fetch(`${API_BASE}/api/jobs/index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.status === 409) {
      chrome.notifications.create(`duplicate-${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Already Tracked',
        message: `${payload.company} — ${payload.role} was already logged.`,
        priority: 1,
      });
      return;
    }

    if (!res.ok) throw new Error(data.error || 'API error');

    chrome.notifications.create(`job-logged-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '✅ Application Logged!',
      message: `${data.job.company} — ${data.job.role}`,
      priority: 2,
    });
  } catch (err) {
    console.error('Failed to log job:', err);
    chrome.notifications.create(`error-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Job Tracker Error',
      message: 'Failed to log application. Check your connection.',
      priority: 1,
    });
  }
}

// ─── Fetch all jobs ────────────────────────────────────────────────────────
async function fetchJobs() {
  const token = await getToken();
  if (!token) return { jobs: [], error: 'Not logged in' };

  try {
    const res = await fetch(`${API_BASE}/api/jobs/index`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return { jobs: [], error: data.error };
    return { jobs: data.jobs };
  } catch {
    return { jobs: [], error: 'Network error' };
  }
}

// ─── Update a job ──────────────────────────────────────────────────────────
async function updateJob(jobId, updates) {
  const token = await getToken();
  if (!token) return { success: false, error: 'Not logged in' };

  try {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true, job: data.job };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// ─── Delete a job ──────────────────────────────────────────────────────────
async function deleteJob(jobId) {
  const token = await getToken();
  if (!token) return { success: false, error: 'Not logged in' };

  try {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
