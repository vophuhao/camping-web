/**
 * useRequireRole
 * Redirects to sign-in if user does not have the required role.
 * Uses Zustand auth store instead of Redux (which is not set up in this project).
 */
'use client';
import { useAuthStore } from '@/store/auth.store';
import { getUser } from '@/lib/client-actions';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const useRequireRole = (requiredRole: 'admin' | 'host' | 'user') => {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await getUser();
        const fetchedUser = (res as ApiResponse<User>).data;
        if (!fetchedUser?.role || fetchedUser.role !== requiredRole) {
          router.push('/');
          return;
        }
        setUser(fetchedUser);
        setIsChecking(false);
      } catch {
        router.push('/sign-in');
      }
    };

    if (!user) {
      checkRole();
    } else if (user.role !== requiredRole) {
      router.push('/');
    } else {
      setIsChecking(false);
    }
  }, [user, requiredRole, router, setUser]);

  return { isChecking };
};
