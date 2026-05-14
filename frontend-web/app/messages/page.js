'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';
import { InboxAPI } from '@/lib/api';
import { useProtected } from '@/lib/useProtected';

export default function MessagesPage() {
  const { loading, isAuthenticated } = useProtected();
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    InboxAPI.getConversations()
      .then((data) => setConversations(data.conversations || []))
      .catch((err) => setError(err.message || 'Could not load messages.'));
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) return <main className="auth-page">Loading...</main>;

  return (
    <AppShell>
      <header className="feed-header">
        <div>
          <h1>Messages</h1>
          <p>Your direct conversations.</p>
        </div>
      </header>
      <section className="panel">
        {error ? <p className="form-error">{error}</p> : null}
        {!conversations.length && !error ? <p className="muted">No messages yet.</p> : null}
        <div className="post-list">
          {conversations.map((item) => (
            <div className="user-line" key={item.id}>
              <Avatar user={item.other_user} />
              <div>
                <div className="username">{item.other_user?.username}</div>
                <div className="meta">{item.latest_message?.body || 'Start the conversation'}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
