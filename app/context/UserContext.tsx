// context/UserContext.tsx
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
  fetchUser: () => Promise<boolean>; // Updated to Promise<boolean>
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
        console.log('[UserContext] Fetch user failed, status:', res.status);
        setUser(null);
        return false; // Indicate failure
      }

      const data = await res.json();
      console.log('[UserContext] /api/get-user response:', data);

      if (!data || !data.user) {
        setUser(null);
        return false; // Indicate failure
      }

      const processedUser = processUserData(data.user);
      setUser(processedUser);
      return true; // Indicate success
    } catch (err) {
      console.error('[UserContext] Fetch user error:', err);
      setUser(null);
      return false; // Indicate failure
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserReputation = (points: number) => {
    if (user) {
      const updatedUser = { ...user, reputation: (user.reputation || 0) + points };
      setUser(updatedUser);
    }
  };

  const logout = async () => {
    try {
      await fetch('https://pulse.great-site.net/Google_signup/logout.php', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[UserContext] Logout error:', error);
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  // Fetch user on mount with retries
  useEffect(() => {
    const attemptFetchUser = async () => {
      let retries = 5;
      while (retries > 0) {
        const success = await fetchUser();
        if (success) break;
        retries--;
        console.log(`[UserContext] Retrying fetchUser, attempts left: ${retries}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    };
    attemptFetchUser();
  }, [fetchUser]);

  // Redirect to /login for protected routes if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      const pathname = window.location.pathname;
      if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/chat') ||
        pathname.startsWith('/ai') ||
        pathname.startsWith('/bookmarks')
      ) {
        console.log('[UserContext] No user, redirecting to /login');
        router.push('/login');
      }
    }
  }, [loading, user, router]);

  // Handle userVerified event from PHP
  useEffect(() => {
    const handleUserVerified = (event: Event) => {
      const customEvent = event as CustomEvent<User>;
      const processedUser = processUserData(customEvent.detail);
      setUser(processedUser);
      router.push('/dashboard');
    };
    window.addEventListener('userVerified', handleUserVerified);
    return () => window.removeEventListener('userVerified', handleUserVerified);
  }, [router]);

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