'use client';

import { useCallback } from 'react';
import AppShell from '@/components/AppShell';
import FeedList from '@/components/FeedList';
import { PostAPI } from '@/lib/api';
import { useProtected } from '@/lib/useProtected';

export default function FeedPage() {
  const { loading, isAuthenticated } = useProtected();
  const loadFeed = useCallback(() => PostAPI.getFeed(), []);

  if (loading || !isAuthenticated) return <main className="auth-page">Loading...</main>;

  return (
    <AppShell aside={<section className="panel"><h2>Web preview</h2><p className="muted">Desktop gets a sidebar; mobile web gets bottom tabs.</p></section>}>
      <header className="feed-header">
        <div>
          <h1>Feed</h1>
          <p>Fresh posts from your circle.</p>
        </div>
      </header>
      <FeedList loader={loadFeed} empty="No posts yet. Create the first one." />
    </AppShell>
  );
}
