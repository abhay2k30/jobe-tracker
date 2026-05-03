async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export const api = {
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => apiFetch('/auth/me', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),

  getJobs: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return apiFetch(`/jobs/index${qs ? `?${qs}` : ''}`);
  },
  createJob: (body) => apiFetch('/jobs/index', { method: 'POST', body: JSON.stringify(body) }),
  updateJob: (id, body) => apiFetch(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteJob: (id) => apiFetch(`/jobs/${id}`, { method: 'DELETE' }),
};
