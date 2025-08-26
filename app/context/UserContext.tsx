'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  picture?: string
  token?: string
  reputation?: number
  role?: string
  is_verified?: boolean
  agreed_to_terms?: boolean
  google_id?: string
}

interface UserContextType {
  user: User | null
  loading: boolean
  logout: () => void
  fetchUser: () => Promise<void>
  updateUserReputation: (points: number) => void
  login: (userData: User) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const login = (userData: User) => {
    const processedUser = processUserData(userData);
    setUser(processedUser);
    localStorage.setItem('userData', JSON.stringify(processedUser));
  };

  // Helper function to process user data consistently
  const processUserData = (userData: any): User => {
    return {
      id: userData.id?.toString() || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: userData.name || userData.email?.split('@')[0] || 'Unknown User',
      email: userData.email || '',
      picture: userData.picture && !/^https?:\/\//i.test(userData.picture) 
        ? `https://pulse.great-site.net/Google_signup/uploads/${userData.picture}`
        : userData.picture || '/default-profile.png',
      reputation: userData.reputation || 0,
      role: userData.role || 'user',
      is_verified: userData.is_verified || false,
      agreed_to_terms: userData.agreed_to_terms || false,
      google_id: userData.google_id,
      token: userData.token
    };
  };

  const fetchUser = async () => {
    try {
      console.log('Attempting to fetch user data...');
      
      const response = await fetch('https://pulse.great-site.net/Google_signup/get_user.php', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      console.log('Response status:', response.status);
      
      // Handle 401 unauthorized first
      if (response.status === 401) {
        console.log('User not authenticated, clearing local data');
        localStorage.removeItem('userData');
        setUser(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      console.log('Raw user data from server:', userData);

      // Check if we got an error response instead of user data
      if (userData.error) {
        throw new Error(userData.error);
      }

      // Process the user data using the actual response format
      const processedUser = processUserData(userData);
      console.log('Processed user data:', processedUser);
      
      setUser(processedUser);
      localStorage.setItem('userData', JSON.stringify(processedUser));
      
    } catch (error) {
      console.error('Fetch user error:', error);
      // Fallback to localStorage if server fetch fails
      try {
        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Using fallback user data from localStorage');
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (localStorageError) {
        console.error('LocalStorage error:', localStorageError);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserReputation = (points: number) => {
    if (user) {
      const updatedUser = {
        ...user,
        reputation: (user.reputation || 0) + points
      };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

  const logout = async () => {
    try {
      // Clear client-side storage
      localStorage.removeItem('userData');
      
      // Clear cookies with proper domain
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=.great-site.net");
      });
      
      // Call server logout
      await fetch('https://pulse.great-site.net/Google_signup/logout.php', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      window.location.href = '/?t=' + new Date().getTime();
    }
  };

  useEffect(() => {
    // Listen for user verification event from verify_email.php
    const handleUserVerified = (event: CustomEvent) => {
      console.log('User verified event received:', event.detail);
      const processedUser = processUserData(event.detail);
      setUser(processedUser);
      localStorage.setItem('userData', JSON.stringify(processedUser));
    };

    window.addEventListener('userVerified', handleUserVerified as EventListener);
    
    return () => {
      window.removeEventListener('userVerified', handleUserVerified as EventListener);
    };
  }, []);

  useEffect(() => {
    // Check localStorage first for faster loading
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLoading(false);
        console.log('User data loaded from localStorage');
      } catch (error) {
        console.error('Error parsing localStorage user data:', error);
        localStorage.removeItem('userData');
      }
    }
    
    // Then fetch fresh data from server
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      loading, 
      logout, 
      fetchUser, 
      updateUserReputation,
      login
    }}>
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