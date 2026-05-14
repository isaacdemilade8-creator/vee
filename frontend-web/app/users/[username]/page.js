'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';
import FeedList from '@/components/FeedList';
import { UserAPI } from '@/lib/api';
import { useProtected } from '@/lib/useProtected';

export default function UserPage() {
  const { loading, isAuthenticated } = useProtected();
  const [profile, setProfile] = useState(null);
  const { username } = useParams();
  const loader = useCallback(() => UserAPI.getUserPosts(username), [username]);

  useEffect(() => {
    if (!isAuthenticated) return;
    UserAPI.getProfile(username).then((data) => setProfile(data.user || data)).catch(() => setProfile(null));
  }, [isAuthenticated, username]);

  if (loading || !isAuthenticated) return <main className="auth-page">Loading...</main>;

  return (
    <AppShell>
      <section className="post-card profile-card">
        <div className="cover" />
        <div className="profile-body">
          <Avatar user={profile || { username }} />
          <h1>{profile?.full_name || username}</h1>
          <p className="muted">@{username}</p>
          {profile?.bio ? <p>{profile.bio}</p> : null}
        </div>
      </section>
      <div style={{ height: 16 }} />
      <FeedList loader={loader} empty="No posts here yet." />
    </AppShell>
  );
}
