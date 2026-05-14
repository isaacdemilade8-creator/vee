'use client';

import { useEffect, useState } from 'react';
import PostCard from './PostCard';

export default function FeedList({ loader, empty = 'Nothing here yet.' }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loader()
      .then((data) => {
        if (!active) return;
        setPosts(data.posts || data.data || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load posts.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loader]);

  if (loading) return <section className="panel">Loading posts...</section>;
  if (error) return <section className="panel form-error">{error}</section>;
  if (!posts.length) return <section className="panel muted">{empty}</section>;

  return (
    <div className="post-list">
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
