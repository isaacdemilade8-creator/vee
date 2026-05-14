'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiCompass, FiHome, FiLogOut, FiMessageCircle, FiPlusSquare, FiUser } from 'react-icons/fi';
import { useAuth } from '@/lib/auth';
import Avatar from './Avatar';

const navItems = [
  { href: '/', label: 'Feed', icon: FiHome },
  { href: '/explore', label: 'Explore', icon: FiCompass },
  { href: '/create', label: 'Create', icon: FiPlusSquare },
  { href: '/messages', label: 'Messages', icon: FiMessageCircle },
  { href: '/profile', label: 'Profile', icon: FiUser }
];

function isActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export default function AppShell({ children, aside }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">V</span>
          <span>
            <h1>Vee</h1>
            <p>Web studio</p>
          </span>
        </Link>

        <nav className="nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={isActive(pathname, item.href) ? 'active' : ''}>
              <item.icon aria-hidden />
              {item.label}
            </Link>
          ))}
          <button type="button" onClick={handleLogout}><FiLogOut aria-hidden /> Log out</button>
        </nav>
      </aside>

      <main className="main">{children}</main>

      <aside className="right-rail">
        <section className="panel">
          <h2>Signed in</h2>
          <div className="user-line">
            <Avatar user={user} />
            <div>
              <div className="username">{user?.username || 'Vee creator'}</div>
              <div className="meta">{user?.full_name || 'Ready to create'}</div>
            </div>
          </div>
        </section>
        {aside}
      </aside>

      <nav className="mobile-tabs">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={isActive(pathname, item.href) ? 'active' : ''}>
            <item.icon aria-hidden />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
