'use client';

import { useCallback } from 'react';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';
import FeedList from '@/components/FeedList';
import { UserAPI } from '@/lib/api';
import { useProtected } from '@/lib/useProtected';

export default function ProfilePage() {
  const { loading, isAuthenticated, user } = useProtected();
  const loader = useCallback(() => UserAPI.getUserPosts(user?.username), [user?.username]);

  if (loading || !isAuthenticated || !user) return <main className="auth-page">Loading...</main>;

  return (
    <AppShell>
      <section className="post-card profile-card">
        <div className="cover" />
        <div className="profile-body">
          <Avatar user={user} />
          <h1>{user.full_name || user.username}</h1>
          <p className="muted">@{user.username}</p>
          {user.bio ? <p>{user.bio}</p> : null}
          <div className="actions">
            <span className="chip">{user.followers_count ?? 0} followers</span>
            <span className="chip">{user.following_count ?? 0} following</span>
          </div>
        </div>
      </section>
      <div style={{ height: 16 }} />
      <FeedList loader={loader} empty="No posts on your profile yet." />
    </AppShell>
  );
}
