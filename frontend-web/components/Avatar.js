import { normalizeMediaUrl } from '@/lib/api';

export default function Avatar({ user, size }) {
  const avatar = normalizeMediaUrl(user?.avatar_url);
  const letter = (user?.username || user?.full_name || 'V').slice(0, 1).toUpperCase();

  return (
    <span className="avatar" style={size ? { width: size, height: size } : undefined}>
      {avatar ? <img src={avatar} alt="" /> : letter}
    </span>
  );
}
