'use client';

import { useCallback, useState } from 'react';
import AppShell from '@/components/AppShell';
import FeedList from '@/components/FeedList';
import { DiscoveryAPI } from '@/lib/api';
import { useProtected } from '@/lib/useProtected';

export default function ExplorePage() {
  const { loading, isAuthenticated } = useProtected();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const loader = useCallback(() => (
    submitted ? DiscoveryAPI.search(submitted) : DiscoveryAPI.categoryPosts('trending')
  ), [submitted]);

  if (loading || !isAuthenticated) return <main className="auth-page">Loading...</main>;

  return (
    <AppShell>
      <header className="feed-header">
        <div>
          <h1>Explore</h1>
          <p>Search users, captions, and hashtags.</p>
        </div>
      </header>
      <form className="panel" onSubmit={(event) => { event.preventDefault(); setSubmitted(query.trim()); }}>
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Vee" />
      </form>
      <div style={{ height: 14 }} />
      <FeedList loader={loader} empty="No results found." />
    </AppShell>
  );
}
