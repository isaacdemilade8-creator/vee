'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { PostAPI } from '@/lib/api';
import { useProtected } from '@/lib/useProtected';

export default function CreatePage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useProtected();
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await PostAPI.create({
        caption,
        media,
        post_type: media ? 'media' : 'text',
        media_type: media ? media.type.split('/')[0] : 'text'
      });
      router.push('/');
    } catch (err) {
      setError(err.message || 'Could not create post.');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !isAuthenticated) return <main className="auth-page">Loading...</main>;

  return (
    <AppShell>
      <header className="feed-header">
        <div>
          <h1>Create</h1>
          <p>Post text, photos, video, or audio to the same backend.</p>
        </div>
      </header>
      <form className="composer-card" style={{ padding: 16 }} onSubmit={submit}>
        <label className="field">
          <span>Caption</span>
          <textarea className="textarea" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="What are you creating today?" />
        </label>
        <label className="field">
          <span>Media</span>
          <input className="input" type="file" accept="image/*,video/*,audio/*" onChange={(e) => setMedia(e.target.files?.[0] || null)} />
        </label>
        <button className="btn" disabled={busy || (!caption.trim() && !media)}>{busy ? 'Posting...' : 'Share post'}</button>
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </AppShell>
  );
}
