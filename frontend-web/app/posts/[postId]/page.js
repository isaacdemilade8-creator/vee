'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';
import PostCard from '@/components/PostCard';
import { CommentAPI, PostAPI } from '@/lib/api';
import { useProtected } from '@/lib/useProtected';

export default function PostPage() {
  const { postId } = useParams();
  const { loading, isAuthenticated } = useProtected();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !postId) return;
    Promise.all([PostAPI.getOne(postId), CommentAPI.getAll(postId)])
      .then(([postData, commentData]) => {
        setPost(postData.post || postData);
        setComments(commentData.comments || []);
      })
      .catch((err) => setError(err.message || 'Could not load post.'));
  }, [isAuthenticated, postId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    const data = await CommentAPI.add(postId, body.trim());
    setComments((current) => [data.comment, ...current]);
    setBody('');
  };

  if (loading || !isAuthenticated) return <main className="auth-page">Loading...</main>;

  return (
    <AppShell>
      {error ? <section className="panel form-error">{error}</section> : null}
      {post ? <PostCard post={post} /> : <section className="panel">Loading post...</section>}
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Comments</h2>
        <form onSubmit={submit} className="field">
          <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment" />
          <button className="btn" disabled={!body.trim()}>Send</button>
        </form>
        <div className="post-list">
          {comments.map((comment) => (
            <div className="user-line" key={comment.id}>
              <Avatar user={comment.user} />
              <div>
                <div className="username">{comment.user?.username}</div>
                <div>{comment.body}</div>
              </div>
            </div>
          ))}
          {!comments.length ? <p className="muted">No comments yet.</p> : null}
        </div>
      </section>
    </AppShell>
  );
}
