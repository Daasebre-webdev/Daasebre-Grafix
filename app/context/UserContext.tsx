'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';

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

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/get-user', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok || res.status === 401) {
        setUser(null);
        return false;
      }

      const data = await res.json();
      if (!data || !data.user) {
        setUser(null);
        return false;
      }

      const processedUser = processUserData(data.user);
      setUser(processedUser);
      return true;
    } catch (err) {
      console.error('[UserContext] Fetch user error:', err);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserReputation = (points: number) => {
    if (user) {
      setUser({ ...user, reputation: (user.reputation || 0) + points });
    }
  };

  const logout = async () => {
  try {
    // Call backend logout.php
    const res = await fetch('https://pulse.great-site.net/Google_signup/logout.php', {
      method: 'POST',
      credentials: 'include', // send cookies to backend
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('[UserContext] Backend logout failed', res.status, res.statusText);
    }
  } catch (error) {
    console.error('[UserContext] Logout error:', error);
  } finally {
    // Clear frontend user state
    setUser(null);

    // Clear __test cookie client-side
    document.cookie = '__test=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=None; secure;';

    // Redirect to login safely
    router.push('/login');
  }
};


 useEffect(() => {
  const attemptFetchUser = async () => {
    let retries = 5;
    let success = false;
    while (retries > 0 && !success) {
      success = await fetchUser();
      if (success) break;
      retries--;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (!success) {
      router.push('/login');
    }
  };
  attemptFetchUser();
}, [fetchUser, router]);


  // Handle userVerified event from PHP
  useEffect(() => {
    const handleUserVerified = (event: MessageEvent) => {
      if (event.origin !== 'https://pulse.great-site.net') return;
      if (event.data.type === 'userVerified' && event.data.detail) {
        const processedUser = processUserData(event.data.detail);
        setUser(processedUser);

        if (event.data.detail.token) {
          // Set __test cookie for your actual frontend domain
          document.cookie = `__test=${encodeURIComponent(
            event.data.detail.token
          )}; path=/; secure; samesite=None; domain=.pulse-woad-mu.vercel.app`;

          // Validate cookie immediately
          fetchUser().then((success) => {
            if (success) {
              router.push('/dashboard');
            } else {
              router.push('/login');
            }
          });
        } else {
          router.push('/login');
        }
      }
    };
    window.addEventListener('message', handleUserVerified);
    return () => window.removeEventListener('message', handleUserVerified);
  }, [router, fetchUser]);

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
