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

  // ✅ Strong typing instead of `any`
  const processUserData = (userData: Partial<User>): User => {
    return {
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
    }
  }

  const login = (userData: User) => {
    const processedUser = processUserData(userData)
    setUser(processedUser)
    localStorage.setItem('userData', JSON.stringify(processedUser))
  }

  // ✅ Wrapped fetchUser in useCallback
  const fetchUser = useCallback(async () => {
    try {
      console.log('Attempting to fetch user data...')

      const res = await fetch('/api/get-user', {
        method: 'GET',
        credentials: 'include',
      })

      console.log('Response status:', res.status)

      if (res.status === 401) {
        console.log('User not authenticated, clearing local data')
        localStorage.removeItem('userData')
        setUser(null)
        setLoading(false)
        return
      }

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const userData = await res.json()
      console.log('Raw user data from server:', userData)

      if (userData.error) throw new Error(userData.error)

      const processedUser = processUserData(userData)
      console.log('Processed user data:', processedUser)

      setUser(processedUser)
      localStorage.setItem('userData', JSON.stringify(processedUser))
    } catch (error) {
      console.error('Fetch user error:', error)
      // fallback to localStorage
      try {
        const storedUser = localStorage.getItem('userData')
        if (storedUser) {
          const parsedUser: User = JSON.parse(storedUser)
          console.log('Using fallback user data from localStorage')
          setUser(parsedUser)
        } else {
          setUser(null)
        }
      } catch (localStorageError) {
        console.error('LocalStorage error:', localStorageError)
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateUserReputation = (points: number) => {
    if (user) {
      const updatedUser = {
        ...user,
        reputation: (user.reputation || 0) + points,
      }
      setUser(updatedUser)
      localStorage.setItem('userData', JSON.stringify(updatedUser))
    }
  }
const logout = async () => {
  try {
    // Clear local storage
    localStorage.removeItem('userData');

    // Call PHP logout endpoint to clear token + cookie
    await fetch(
      'https://pulse.great-site.net/Google_signup/logout.php',
      {
        method: 'POST',
        credentials: 'include', // sends __test cookie
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear frontend state
    setUser(null);

    // Redirect user to the PHP login page
    window.location.href = 'https://pulse.great-site.net/Google_signup/index.php?t=' + new Date().getTime();
  }
};


  useEffect(() => {
    const handleUserVerified = (event: Event) => {
      const customEvent = event as CustomEvent<User>
      console.log('User verified event received:', customEvent.detail)
      const processedUser = processUserData(customEvent.detail)
      setUser(processedUser)
      localStorage.setItem('userData', JSON.stringify(processedUser))
    }

    window.addEventListener('userVerified', handleUserVerified)
    return () => {
      window.removeEventListener('userVerified', handleUserVerified)
    }
  }, [])

  useEffect(() => {
    const storedUser = localStorage.getItem('userData')
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser)
        setUser(parsedUser)
        setLoading(false)
        console.log('User data loaded from localStorage')
      } catch (error) {
        console.error('Error parsing localStorage user data:', error)
        localStorage.removeItem('userData')
      }
    }
    fetchUser()
  }, [fetchUser]) // ✅ safe now because fetchUser is memoized

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        logout,
        fetchUser,
        updateUserReputation,
        login,
      }}
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
