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
}

interface UserContextType {
  user: User | null
  loading: boolean
  logout: () => void
  fetchUser: () => Promise<void>
  updateUserReputation: (points: number) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const response = await fetch('https://pulse.great-site.net/Google_signup/get_user.php', {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Not authenticated')

      const userData = await response.json()

      // Ensure we have an id (generate one if not provided by server)
      if (!userData.id) {
        userData.id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Set default values for reputation and role
      userData.reputation = userData.reputation || 0;
      userData.role = userData.role || 'user';

      // Ensure picture is a full URL for Next.js Image
      if (userData.picture) {
        if (!/^https?:\/\//i.test(userData.picture)) {
          userData.picture = `https://pulse.great-site.net/Google_signup/uploads/${userData.picture}`
        }
      } else {
        userData.picture = '/default-profile.png'
      }

      setUser(userData)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const updateUserReputation = (points: number) => {
    if (user) {
      const updatedUser = {
        ...user,
        reputation: (user.reputation || 0) + points
      };
      setUser(updatedUser);
      
      // Update reputation in localStorage
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        localStorage.setItem('userData', JSON.stringify({
          ...parsedData,
          reputation: updatedUser.reputation
        }));
      }
    }
  };

  const logout = async () => {
    try {
      // Clear client-side storage first
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authState');
      localStorage.removeItem('userData');
      
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Call server logout
      await fetch('https://pulse.great-site.net/Google_signup/logout.php', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null)
      // Force a hard redirect with cache busting to ensure clean state
      window.location.href = '/?t=' + new Date().getTime();
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <UserContext.Provider value={{ user, loading, logout, fetchUser, updateUserReputation }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}

export default UserContext