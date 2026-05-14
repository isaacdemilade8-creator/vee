'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiBarChart2, FiHeart, FiMessageCircle, FiRepeat, FiSend } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { PostAPI } from '@/lib/api';
import Avatar from './Avatar';
import MediaView from './MediaView';

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(!!post.is_liked);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [reposts, setReposts] = useState(post.reposts_count || 0);

  const like = async () => {
    setLiked((value) => !value);
    setLikes((value) => value + (liked ? -1 : 1));
    try {
      const data = await PostAPI.like(post.id);
      if (typeof data.likes_count === 'number') setLikes(data.likes_count);
      if (typeof data.liked === 'boolean') setLiked(data.liked);
    } catch {
      setLiked((value) => !value);
      setLikes((value) => value + (liked ? 1 : -1));
    }
  };

  const repost = async () => {
    try {
      const data = await PostAPI.repost(post.id);
      if (typeof data.reposts_count === 'number') setReposts(data.reposts_count);
    } catch {
      // Keep the card usable if repost fails.
    }
  };

  return (
    <article className="post-card">
      <div className="post-head">
        <Link className="user-line" href={`/users/${post.user?.username}`}>
          <Avatar user={post.user} />
          <span>
            <span className="username">{post.user?.username || 'creator'}</span>
            <span className="meta" style={{ display: 'block' }}>{post.media_type || post.post_type || 'post'}</span>
          </span>
        </Link>
        <span className="meta">{post.views_count || 0} views</span>
      </div>

      <MediaView post={post} />

      <div className="post-body">
        <div className="actions">
          <button className={`chip ${liked ? 'chip-hot' : ''}`} type="button" onClick={like}>
            {liked ? <FaHeart aria-hidden /> : <FiHeart aria-hidden />} {likes}
          </button>
          <Link className="chip" href={`/posts/${post.id}`}><FiMessageCircle aria-hidden /> {post.comments_count || 0}</Link>
          <button className="chip" type="button" onClick={repost}><FiRepeat aria-hidden /> {reposts}</button>
          <button className="chip" type="button"><FiSend aria-hidden /> Share</button>
          {post.is_owner ? <Link className="chip" href={`/posts/${post.id}`}><FiBarChart2 aria-hidden /> Stats</Link> : null}
        </div>

        {post.caption && post.media_type !== 'text' && post.post_type !== 'text' ? (
          <div className="caption">
            <strong>{post.user?.username}</strong> {post.caption}
          </div>
        ) : null}

        {post.hashtags?.length ? (
          <div className="actions" style={{ marginTop: 12 }}>
            {post.hashtags.slice(0, 5).map((tag) => (
              <Link className="chip" href={`/explore?tag=${tag.name}`} key={tag.id || tag.name}>#{tag.name}</Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
