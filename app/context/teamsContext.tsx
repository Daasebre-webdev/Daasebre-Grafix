'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useUser } from './UserContext'

interface Team {
  id: number
  name: string
  role: string
}

interface TeamsContextType {
  teams: Team[]
  fetchTeams: () => Promise<void>
  createTeam: (name: string) => Promise<void>
  inviteMember: (teamId: number, email: string) => Promise<void>
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined)

export function TeamsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [teams, setTeams] = useState<Team[]>([])

  const fetchTeams = useCallback(async () => {
    if (!user) return
    const res = await fetch('http://localhost/Google_signup/api/teams_list.php', {
      credentials: 'include'
    })
    if (res.ok) {
      setTeams(await res.json())
    }
  }, [user])

  const createTeam = async (name: string) => {
    const res = await fetch('http://localhost/Google_signup/api/teams_create.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (res.ok) await fetchTeams()
  }

  const inviteMember = async (teamId: number, email: string) => {
    await fetch('http://localhost/Google_signup/api/invite_member.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: teamId, email })
    })
  }

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  return (
    <TeamsContext.Provider value={{ teams, fetchTeams, createTeam, inviteMember }}>
      {children}
    </TeamsContext.Provider>
  )
}

export function useTeams() {
  const context = useContext(TeamsContext)
  if (!context) throw new Error('useTeams must be used within TeamsProvider')
  return context
}
