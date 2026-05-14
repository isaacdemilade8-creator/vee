'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Avatar from './Avatar';

const navItems = [
  { href: '/', label: 'Feed', icon: 'F' },
  { href: '/explore', label: 'Explore', icon: 'E' },
  { href: '/create', label: 'Create', icon: 'C' },
  { href: '/messages', label: 'Messages', icon: 'M' },
  { href: '/profile', label: 'Profile', icon: 'P' }
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
              <span className="brand-mark" style={{ width: 24, height: 24, borderRadius: 6, fontSize: 12 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <button type="button" onClick={handleLogout}>Log out</button>
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
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
