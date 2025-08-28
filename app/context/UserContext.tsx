'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'
import Swal from 'sweetalert2'

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
  const [loading, setLoading] = useState(false) // Start with loading false

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

  // 🔹 Login
  const login = (userData: User) => {
    const processedUser = processUserData(userData)
    setUser(processedUser)
    localStorage.setItem('userData', JSON.stringify(processedUser))

    Swal.fire({
      icon: 'success',
      title: 'Welcome 🎉',
      text: `Hello, ${processedUser.name}!`,
      timer: 2500,
      showConfirmButton: false,
    })
  }

  // 🔹 Fetch User
  const fetchUser = useCallback(async () => {
    console.log('Starting fetchUser...')
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.log('Fetch user timed out')
      }, 5000) // 5s timeout

      const res = await fetch('/api/get-user', {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
      })
      console.log('Fetch user response:', res.status, res.statusText)
      clearTimeout(timeoutId)

      if (res.status === 401) {
        console.log('401 Unauthorized, clearing user data')
        localStorage.removeItem('userData')
        setUser(null)
        return
      }

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const userData = await res.json()
      console.log('User data:', userData)
      if (userData.error) throw new Error(userData.error)

      const processedUser = processUserData(userData.user) // Note: userData.user based on get-user route
      setUser(processedUser)
      localStorage.setItem('userData', JSON.stringify(processedUser))
    } catch (error: unknown) {
      console.error('Fetch user error:', (error as Error).message)
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Could not fetch user data. Using saved data if available.',
      })

      const storedUser = localStorage.getItem('userData')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (parseError: unknown) {
          console.error('Error parsing localStorage user data:', (parseError as Error).message)
          localStorage.removeItem('userData')
        }
      } else {
        setUser(null)
      }
    } finally {
      console.log('Fetch user complete, loading:', false)
      setLoading(false)
    }
  }, [])

  // 🔹 Load from localStorage without setting loading
  useEffect(() => {
    const storedUser = localStorage.getItem('userData')
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error: unknown) {
        console.error('Error parsing localStorage user data:', (error as Error).message)
        localStorage.removeItem('userData')
      }
    }
    // Do not call fetchUser or set loading here
  }, [])

  // 🔹 Update Reputation
  const updateUserReputation = (points: number) => {
    if (user) {
      const updatedUser = {
        ...user,
        reputation: (user.reputation || 0) + points,
      }
      setUser(updatedUser)
      localStorage.setItem('userData', JSON.stringify(updatedUser))

      Swal.fire({
        icon: 'success',
        title: 'Reputation Updated ✅',
        text: `You gained ${points} points!`,
        timer: 2000,
        showConfirmButton: false,
      })
    }
  }

  // 🔹 Logout
  const logout = async () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          localStorage.removeItem('userData')

          await fetch('https://pulse.great-site.net/Google_signup/logout.php', {
            method: 'POST',
            credentials: 'include',
          })

          Swal.fire({
            icon: 'success',
            title: 'Logged out 👋',
            timer: 2000,
            showConfirmButton: false,
          })
        } catch (error: unknown) {
          console.error('Logout error:', (error as Error).message)
          Swal.fire({
            icon: 'error',
            title: 'Logout failed ❌',
            text: 'Please try again.',
          })
        } finally {
          setUser(null)
          window.location.href =
            'https://pulse.great-site.net/Google_signup/index.php?t=' + new Date().getTime()
        }
      }
    })
  }

  // 🔹 Listen for email verification events
  useEffect(() => {
    const handleUserVerified = (event: Event) => {
      const customEvent = event as CustomEvent<User>
      const processedUser = processUserData(customEvent.detail)
      setUser(processedUser)
      localStorage.setItem('userData', JSON.stringify(processedUser))

      Swal.fire({
        icon: 'success',
        title: 'Email Verified 🎉',
        text: 'Your account has been verified successfully!',
        timer: 2500,
        showConfirmButton: false,
      })
    }

    window.addEventListener('userVerified', handleUserVerified)
    return () => {
      window.removeEventListener('userVerified', handleUserVerified)
    }
  }, [])

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