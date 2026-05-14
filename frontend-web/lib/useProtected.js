'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth';

export function useProtected() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.replace('/login');
    }
  }, [auth.loading, auth.isAuthenticated, router]);

  return auth;
}
