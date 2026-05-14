'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiLogIn } from 'react-icons/fi';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      router.replace('/');
    } catch (err) {
      setError(err.message || 'Could not log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand">
          <span className="brand-mark">V</span>
          <span>
            <h1>Vee</h1>
            <p>Sign in to continue</p>
          </span>
        </div>

        <label className="field">
          <span>Email or username</span>
          <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="username" />
        </label>
        <label className="field">
          <span>Password</span>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
        </label>
        <button className="btn" disabled={loading}><FiLogIn aria-hidden /> {loading ? 'Signing in...' : 'Log in'}</button>
        {error ? <p className="form-error">{error}</p> : null}
        <p className="muted">New here? <Link href="/register"><strong>Create an account</strong></Link></p>
      </form>
    </main>
  );
}
