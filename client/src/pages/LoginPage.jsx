import { useState } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit() {
    if (!form.email || !form.password) return setError('Email and password are required.');
    if (mode === 'register' && !form.name) return setError('Name is required.');
    setLoading(true);
    const result = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.password);
    setLoading(false);
    if (!result.ok) setError(result.error || 'Something went wrong.');
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-semibold text-stone-900 tracking-tight">Job Tracker</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-7 shadow-sm">
          <h1 className="text-xl font-semibold text-stone-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-stone-400 mb-6">
            {mode === 'login' ? 'Sign in to your dashboard' : 'Start tracking your applications'}
          </p>

          <div className="space-y-3">
            {mode === 'register' && (
              <Field label="Name" name="name" type="text" placeholder="Your name"
                value={form.name} onChange={handleChange} onEnter={handleSubmit} />
            )}
            <Field label="Email" name="email" type="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange} onEnter={handleSubmit} />
            <Field label="Password" name="password" type="password" placeholder="Min 6 characters"
              value={form.password} onChange={handleChange} onEnter={handleSubmit} />
          </div>

          {error && (
            <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-5 w-full py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <p className="mt-4 text-center text-xs text-stone-400">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-stone-700 font-medium hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type, placeholder, value, onChange, onEnter }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 mb-1.5">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all placeholder:text-stone-300"
      />
    </div>
  );
}
