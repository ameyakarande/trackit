import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { createDefaultCategories, MAX_USERS, STORAGE_KEYS } from '../constants'
import { generateInviteCode } from '../lib/utils'
import { supabase } from '../lib/supabase'
import type { SessionUser, TrackingMode, TrackingSpace } from '../types'

type ActionResult = { success: boolean; message?: string }

type AuthContextValue = {
  user: SessionUser | null
  allUsers: SessionUser[]
  accessibleSpaces: TrackingSpace[]
  currentSpace: TrackingSpace | null
  currentSpaceMembers: SessionUser[]
  login: (email: string, password: string) => Promise<ActionResult>
  signup: (name: string, email: string, password: string) => Promise<ActionResult>
  createSpace: (name: string, mode: TrackingMode) => Promise<ActionResult>
  joinGroupSpace: (inviteCode: string) => Promise<ActionResult>
  selectSpace: (spaceId: string) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [allUsers, setAllUsers] = useState<SessionUser[]>([])
  const [accessibleSpaces, setAccessibleSpaces] = useState<TrackingSpace[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(
    () => window.localStorage.getItem(STORAGE_KEYS.selectedSpace),
  )

  // Listen for Supabase auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            createdAt: profile.created_at,
          })
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch accessible spaces
  useEffect(() => {
    if (!user) {
      setAccessibleSpaces([])
      return
    }

    const fetchSpaces = async () => {
      const { data: spaceMembers } = await supabase
        .from('space_members')
        .select('space_id')
        .eq('user_id', user.id)

      if (spaceMembers && spaceMembers.length > 0) {
        const spaceIds = spaceMembers.map(sm => sm.space_id)
        const { data: spaces } = await supabase
          .from('spaces')
          .select('*')
          .in('id', spaceIds)

        if (spaces) {
          setAccessibleSpaces(spaces.map(s => ({
            id: s.id,
            name: s.name,
            mode: s.mode as TrackingMode,
            inviteCode: s.invite_code,
            ownerId: s.owner_id,
            memberIds: [], // We'll fetch these when needed or simplify
            createdAt: s.created_at,
          })))
        }
      } else {
        setAccessibleSpaces([])
      }
    }

    fetchSpaces()
  }, [user])

  // Manage selected space
  useEffect(() => {
    if (accessibleSpaces.length === 0) {
      setSelectedSpaceId(null)
      window.localStorage.removeItem(STORAGE_KEYS.selectedSpace)
      return
    }

    const stillExists = accessibleSpaces.some((space) => space.id === selectedSpaceId)
    if (!stillExists) {
      const nextId = accessibleSpaces[0].id
      setSelectedSpaceId(nextId)
      window.localStorage.setItem(STORAGE_KEYS.selectedSpace, nextId)
    }
  }, [accessibleSpaces, selectedSpaceId])

  const login = async (email: string, password: string): Promise<ActionResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, message: error.message }
    return { success: true }
  }

  const signup = async (name: string, email: string, password: string): Promise<ActionResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { success: false, message: error.message }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        email,
      })
      if (profileError) return { success: false, message: profileError.message }
    }

    return { success: true }
  }

  const createSpace = async (name: string, mode: TrackingMode): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in first.' }

    const inviteCode = mode === 'group' ? generateInviteCode() : null
    
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .insert({
        name,
        mode,
        invite_code: inviteCode,
        owner_id: user.id,
      })
      .select()
      .single()

    if (spaceError) return { success: false, message: spaceError.message }

    // Add owner as member
    const { error: memberError } = await supabase
      .from('space_members')
      .insert({ space_id: space.id, user_id: user.id })

    if (memberError) return { success: false, message: memberError.message }

    // Create default categories
    const defaults = createDefaultCategories(space.id).map(cat => ({
      space_id: cat.spaceId,
      name: cat.name,
      icon: cat.icon,
      tone: cat.tone,
      is_default: true,
    }))

    await supabase.from('categories').insert(defaults)

    setSelectedSpaceId(space.id)
    window.localStorage.setItem(STORAGE_KEYS.selectedSpace, space.id)
    return { success: true }
  }

  const joinGroupSpace = async (inviteCode: string): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in first.' }

    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (spaceError || !space) return { success: false, message: 'That invite code was not found.' }

    // Check member count
    const { count } = await supabase
      .from('space_members')
      .select('*', { count: 'exact', head: true })
      .eq('space_id', space.id)

    if (count && count >= MAX_USERS) {
      return { success: false, message: 'This group already has 4 members.' }
    }

    // Join
    const { error: joinError } = await supabase
      .from('space_members')
      .insert({ space_id: space.id, user_id: user.id })

    if (joinError) {
      if (joinError.code === '23505') { // Already joined
        setSelectedSpaceId(space.id)
        window.localStorage.setItem(STORAGE_KEYS.selectedSpace, space.id)
        return { success: true }
      }
      return { success: false, message: joinError.message }
    }

    setSelectedSpaceId(space.id)
    window.localStorage.setItem(STORAGE_KEYS.selectedSpace, space.id)
    return { success: true }
  }

  const selectSpace = (spaceId: string) => {
    setSelectedSpaceId(spaceId)
    window.localStorage.setItem(STORAGE_KEYS.selectedSpace, spaceId)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.localStorage.removeItem(STORAGE_KEYS.selectedSpace)
    setUser(null)
  }

  const currentSpace = useMemo(
    () => accessibleSpaces.find((space) => space.id === selectedSpaceId) ?? null,
    [accessibleSpaces, selectedSpaceId],
  )

  // Fetch current space members
  const [currentSpaceMembers, setCurrentSpaceMembers] = useState<SessionUser[]>([])
  useEffect(() => {
    if (!currentSpace) {
      setCurrentSpaceMembers([])
      return
    }

    const fetchMembers = async () => {
      const { data: members } = await supabase
        .from('space_members')
        .select('user_id')
        .eq('space_id', currentSpace.id)

      if (members) {
        const userIds = members.map(m => m.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)

        if (profiles) {
          setCurrentSpaceMembers(profiles.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            createdAt: p.created_at,
          })))
        }
      }
    }

    fetchMembers()
  }, [currentSpace])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      allUsers,
      accessibleSpaces,
      currentSpace,
      currentSpaceMembers,
      login,
      signup,
      createSpace,
      joinGroupSpace,
      selectSpace,
      logout,
    }),
    [accessibleSpaces, currentSpace, currentSpaceMembers, allUsers, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
