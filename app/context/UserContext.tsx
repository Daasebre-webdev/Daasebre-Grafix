'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'

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
  })

  const login = (userData: User) => {
    const processedUser = processUserData(userData)
    setUser(processedUser)
    localStorage.setItem('userData', JSON.stringify(processedUser))
  }

  const fetchUser = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/get-user', {
        method: 'GET',
        credentials: 'include',
      })

      if (!res.ok || res.status === 401) {
        setUser(null)
        localStorage.removeItem('userData')
        return
      }

      const data = await res.json()
      if (!data || !data.user) {
        setUser(null)
        localStorage.removeItem('userData')
        return
      }

      const processedUser = processUserData(data.user)
      setUser(processedUser)
      localStorage.setItem('userData', JSON.stringify(processedUser))
    } catch (err) {
      console.error('Fetch user error:', err)
      // fallback to localStorage only if fetch fails
      const storedUser = localStorage.getItem('userData')
      if (storedUser) setUser(JSON.parse(storedUser))
      else setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateUserReputation = (points: number) => {
    if (user) {
      const updatedUser = { ...user, reputation: (user.reputation || 0) + points }
      setUser(updatedUser)
      localStorage.setItem('userData', JSON.stringify(updatedUser))
    }
  }

  const logout = async () => {
    try {
      await fetch('https://pulse.great-site.net/Google_signup/logout.php', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('userData')
      setUser(null)
      window.location.href =
        'https://pulse.great-site.net/Google_signup/index.php?t=' +
        new Date().getTime()
    }
  }

  // Listen for userVerified event
  useEffect(() => {
    const handleUserVerified = (event: Event) => {
      const customEvent = event as CustomEvent<User>
      const processedUser = processUserData(customEvent.detail)
      setUser(processedUser)
      localStorage.setItem('userData', JSON.stringify(processedUser))
    }
    window.addEventListener('userVerified', handleUserVerified)
    return () => {
      window.removeEventListener('userVerified', handleUserVerified)
    }
  }, [])

  // Fetch user on mount
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Redirect to login only if loading is finished and user is null
  useEffect(() => {
    if (!loading && !user) {
      const pathname = window.location.pathname
      if (!pathname.includes('index.php') && !pathname.includes('Google_signup')) {
        window.location.href =
          'https://pulse.great-site.net/Google_signup/index.php'
      }
    }
  }, [loading, user])

  return (
    <UserContext.Provider
      value={{ user, loading, logout, fetchUser, updateUserReputation, login }}
    >
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
