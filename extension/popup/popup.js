const STATUSES = ['Applied', 'In Review', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

const STATUS_COLORS = {
  Applied: { border: '#93c5fd', color: '#1d4ed8', bg: '#eff6ff' },
  'In Review': { border: '#fcd34d', color: '#92400e', bg: '#fffbeb' },
  Interview: { border: '#c4b5fd', color: '#5b21b6', bg: '#f5f3ff' },
  Offer: { border: '#6ee7b7', color: '#065f46', bg: '#ecfdf5' },
  Rejected: { border: '#fca5a5', color: '#991b1b', bg: '#fef2f2' },
  Withdrawn: { border: '#d1d5db', color: '#6b7280', bg: '#f9fafb' },
};

function showView(name) {
  ['login', 'main', 'loading'].forEach((v) => {
    document.getElementById(`${v}-view`).classList.add('hidden');
  });
  document.getElementById(`${name}-view`).classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  showView('loading');

  chrome.storage.local.get(['token', 'user'], (result) => {
    if (result.token && result.user) {
      showMain(result.user);
    } else {
      showView('login');
    }
  });

  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'LOGOUT' });
    showView('login');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
  });
});

async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');

  if (!email || !password) {
    errorEl.textContent = 'Please fill in all fields.';
    errorEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('login-btn');
  btn.textContent = 'Signing in…';
  btn.disabled = true;

  chrome.runtime.sendMessage({ type: 'LOGIN', email, password }, (res) => {
    btn.textContent = 'Sign in';
    btn.disabled = false;

    if (res.success) {
      errorEl.classList.add('hidden');
      showMain(res.user);
    } else {
      errorEl.textContent = res.error || 'Login failed.';
      errorEl.classList.remove('hidden');
    }
  });
}

function showMain(user) {
  showView('main');
  document.getElementById('user-name').textContent = user.name;
  loadJobs();
}

function loadJobs() {
  const list = document.getElementById('jobs-list');
  list.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

  chrome.runtime.sendMessage({ type: 'GET_JOBS' }, (res) => {
    if (res.error) {
      list.innerHTML = `<p class="empty-text">${res.error}</p>`;
      return;
    }

    const jobs = res.jobs;
    updateStats(jobs);

    if (jobs.length === 0) {
      list.innerHTML = '<p class="empty-text">No applications yet.<br>Visit a job listing to auto-log one.</p>';
      return;
    }

    // Show 10 most recent in popup
    list.innerHTML = jobs.slice(0, 10).map(renderJobCard).join('');

    list.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', (e) => {
        const jobId = e.target.dataset.jobId;
        const newStatus = e.target.value;
        applyStatusStyle(e.target, newStatus);
        chrome.runtime.sendMessage(
          { type: 'UPDATE_JOB', jobId, updates: { status: newStatus } },
          (res) => { if (!res.success) alert('Failed to update: ' + res.error); }
        );
      });
    });
  });
}

function renderJobCard(job) {
  const date = new Date(job.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const style = STATUS_COLORS[job.status] || STATUS_COLORS.Withdrawn;

  const options = STATUSES.map(
    (s) => `<option value="${s}"${s === job.status ? ' selected' : ''}>${s}</option>`
  ).join('');

  return `
    <div class="job-card">
      <div class="job-top">
        <div class="job-info">
          <span class="job-company">${escapeHtml(job.company)}</span>
          <span class="job-role">${escapeHtml(job.role)}</span>
        </div>
        <span class="job-date">${date}</span>
      </div>
      <div class="job-bottom">
        <span class="source-badge">${job.source}</span>
        <select
          class="status-select"
          data-job-id="${job._id}"
          style="border-color:${style.border};color:${style.color};background:${style.bg}"
        >${options}</select>
      </div>
    </div>
  `;
}

function applyStatusStyle(select, status) {
  const style = STATUS_COLORS[status] || STATUS_COLORS.Withdrawn;
  select.style.borderColor = style.border;
  select.style.color = style.color;
  select.style.background = style.bg;
}

function updateStats(jobs) {
  document.getElementById('stat-total').textContent = jobs.length;
  document.getElementById('stat-applied').textContent = jobs.filter((j) => j.status === 'Applied').length;
  document.getElementById('stat-interview').textContent = jobs.filter((j) => j.status === 'Interview').length;
  document.getElementById('stat-offer').textContent = jobs.filter((j) => j.status === 'Offer').length;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
