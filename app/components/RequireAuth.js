// components/RequireAuth.js
'use client'

import { useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { useRouter } from 'next/navigation'

export default function RequireAuth({ children }) {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return children
}