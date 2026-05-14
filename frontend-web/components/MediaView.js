import { normalizeMediaUrl } from '@/lib/api';
import { FiBarChart2, FiFileText, FiImage, FiMusic } from 'react-icons/fi';

export default function MediaView({ post, className = 'media' }) {
  const url = normalizeMediaUrl(post?.media_url || post?.image_url);
  const type = post?.media_type || post?.post_type || 'image';

  if (type === 'video' && url) {
    return <video className={className} src={url} controls playsInline preload="metadata" />;
  }

  if (type === 'audio' && url) {
    return (
      <div className="audio-panel">
        <FiMusic aria-hidden />
        <audio src={url} controls style={{ width: '100%' }} />
      </div>
    );
  }

  if (url && type !== 'text' && type !== 'poll') {
    return <img className={className} src={url} alt="" />;
  }

  return (
    <div className="text-post">
      {type === 'poll' ? <FiBarChart2 aria-hidden /> : type === 'text' ? <FiFileText aria-hidden /> : <FiImage aria-hidden />}
      {post?.caption || (type === 'poll' ? 'Poll post' : 'Text post')}
    </div>
  );
}
