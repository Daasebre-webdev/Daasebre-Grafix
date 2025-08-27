'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  token?: string;
  reputation?: number;
  role?: string;
  is_verified?: boolean;
  agreed_to_terms?: boolean;
  google_id?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  fetchUser: () => Promise<boolean>;
  updateUserReputation: (points: number) => void;
  login: (userData: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const processUserData = (userData: Partial<User>): User => ({
    id:
      userData.id?.toString() ||
      `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: userData.name || userData.email?.split('@')[0] || 'Unknown User',
    email: userData.email || '',
    picture:
      userData.picture && !/^https?:\/\//i.test(userData.picture)
        ? `https://pulse.great-site.net/Google_signup/uploads/${userData.picture}`
        : userData.picture || '/default-profile.png',
    reputation: userData.reputation ?? 0,
    role: userData.role ?? 'user',
    is_verified: userData.is_verified ?? false,
    agreed_to_terms: userData.agreed_to_terms ?? false,
    google_id: userData.google_id,
    token: userData.token,
  });

  const login = (userData: User) => {
    const processedUser = processUserData(userData);
    setUser(processedUser);
  };

  const fetchUser = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('[UserContext] fetchUser: Starting fetch', { pathname });
      const res = await fetch('/api/get-user', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok || res.status === 401) {
        console.warn('[UserContext] fetchUser: Unauthorized or failed', { status: res.status });
        setUser(null);
        return false;
      }

      const data = await res.json();
      console.log('[UserContext] fetchUser: Response', data);
      if (!data || !data.user) {
        console.warn('[UserContext] fetchUser: No user data');
        setUser(null);
        return false;
      }

      const processedUser = processUserData(data.user);
      setUser(processedUser);
      return true;
    } catch (err) {
      console.error('[UserContext] fetchUser: Error', err);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  const updateUserReputation = (points: number) => {
    if (user) {
      setUser({ ...user, reputation: (user.reputation || 0) + points });
    }
  };

  const logout = async () => {
    try {
      console.log('[UserContext] logout: Attempting backend logout');
      const res = await fetch('https://pulse.great-site.net/Google_signup/logout.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.error('[UserContext] logout: Backend failed', res.status, res.statusText);
      }
    } catch (error) {
      console.error('[UserContext] logout: Error', error);
    } finally {
      console.log('[UserContext] logout: Clearing user state and cookie');
      setUser(null);
      document.cookie = '__test=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=None; secure;';
      router.push('/login');
    }
  };

  useEffect(() => {
    const attemptFetchUser = async () => {
      let retries = 5;
      let success = false;
      while (retries > 0 && !success) {
        console.log('[UserContext] attemptFetchUser: Retry', { retries });
        success = await fetchUser();
        if (success) break;
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (!success && pathname !== '/login' && pathname !== '/signup') {
        console.log('[UserContext] attemptFetchUser: Redirecting to login');
        router.push('/login');
      }
    };
    attemptFetchUser();
  }, [fetchUser, pathname, router]);

  useEffect(() => {
    const handleUserVerified = (event: MessageEvent) => {
      console.log('[UserContext] postMessage received:', { origin: event.origin, data: event.data, pathname });
      if (event.origin !== 'https://pulse.great-site.net') {
        console.warn('[UserContext] Invalid origin:', event.origin);
        return;
      }
      if (event.data.type === 'userVerified' && event.data.detail) {
        const processedUser = processUserData(event.data.detail);
        setUser(processedUser);
        if (event.data.detail.token) {
          console.log('[UserContext] Setting __test cookie:', `__test=${encodeURIComponent(event.data.detail.token)}`);
          document.cookie = `__test=${encodeURIComponent(event.data.detail.token)}; path=/; secure; samesite=None; domain=.pulse-woad-mu.vercel.app`;
          const cookies = document.cookie.split('; ').find(row => row.startsWith('__test='));
          console.log('[UserContext] Cookie after set:', cookies);
          fetchUser().then((success) => {
            console.log('[UserContext] fetchUser result:', success);
            if (success && pathname !== '/dashboard') {
              console.log('[UserContext] Redirecting to dashboard');
              router.push('/dashboard');
            } else if (!success && pathname !== '/login') {
              console.log('[UserContext] Redirecting to login');
              router.push('/login');
            }
          });
        } else {
          console.warn('[UserContext] No token in postMessage');
          if (pathname !== '/login') router.push('/login');
        }
      }
    };
    window.addEventListener('message', handleUserVerified);
    return () => window.removeEventListener('message', handleUserVerified);
  }, [router, fetchUser, pathname]);

  // Handle token from query parameter (fallback for no window.opener)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token && !user) {
      console.log('[UserContext] Handling token from query:', token);
      document.cookie = `__test=${encodeURIComponent(token)}; path=/; secure; samesite=None; domain=.pulse-woad-mu.vercel.app`;
      fetchUser().then((success) => {
        if (success && pathname !== '/dashboard') router.push('/dashboard');
        else if (!success && pathname !== '/login') router.push('/login');
      });
    }
  }, [fetchUser, pathname, user]);

  return (
    <UserContext.Provider
      value={{ user, loading, logout, fetchUser, updateUserReputation, login }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}

export default UserContext;