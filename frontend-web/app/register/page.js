'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      router.replace('/');
    } catch (err) {
      const validation = err.data?.errors ? Object.values(err.data.errors).flat().join(' ') : null;
      setError(validation || err.message || 'Could not create account.');
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
            <h1>Create account</h1>
            <p>Join Vee on web</p>
          </span>
        </div>

        <label className="field"><span>Full name</span><input className="input" value={form.full_name} onChange={update('full_name')} /></label>
        <label className="field"><span>Username</span><input className="input" value={form.username} onChange={update('username')} autoComplete="username" /></label>
        <label className="field"><span>Email</span><input className="input" type="email" value={form.email} onChange={update('email')} autoComplete="email" /></label>
        <label className="field"><span>Password</span><input className="input" type="password" value={form.password} onChange={update('password')} autoComplete="new-password" /></label>
        <label className="field"><span>Confirm password</span><input className="input" type="password" value={form.password_confirmation} onChange={update('password_confirmation')} autoComplete="new-password" /></label>
        <button className="btn" disabled={loading}>{loading ? 'Creating...' : 'Sign up'}</button>
        {error ? <p className="form-error">{error}</p> : null}
        <p className="muted">Already have an account? <Link href="/login"><strong>Log in</strong></Link></p>
      </form>
    </main>
  );
}
