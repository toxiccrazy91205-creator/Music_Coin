"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { IUserPublic, UserRole } from "@/types"
import { getProfile as getProfileAction } from "@/lib/auth/auth"

interface AuthContextType {
  user: IUserPublic | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (input: { email?: string; password?: string; isDemo?: boolean; firebaseIdToken?: string }) => Promise<{ success: boolean; error?: string; role?: UserRole }>
  logout: (isDemo?: boolean, firebaseUid?: string) => Promise<void>
  register: (input: { name?: string; email?: string; password?: string; role: UserRole; isDemo?: boolean; firebaseIdToken?: string }) => Promise<{ success: boolean; error?: string }>
  refreshProfile: () => Promise<void>
  globalIsDemo: boolean
  setGlobalIsDemo: (val: boolean) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [globalIsDemo, setGlobalIsDemo] = useState(true)

  const refreshProfile = useCallback(async () => {
    try {
      // Still using server action for profile fetching to avoid redundant API route creation
      const result = await getProfileAction()
      if (result.success) {
        setUser(result.data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    refreshProfile().then(() => {
      if (mounted && isLoading) setIsLoading(false)
    })
    return () => { mounted = false }
  }, [refreshProfile, isLoading])

  const login = useCallback(async (input: { email?: string; password?: string; isDemo?: boolean; firebaseIdToken?: string }) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      })
      const result = await res.json()
      if (result.success) {
        setUser(result.data as IUserPublic)
        return { success: true, role: result.data.role as UserRole }
      }
      return { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: "Network error" }
    }
  }, [])

  const logout = useCallback(async (isDemo?: boolean, firebaseUid?: string) => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDemo, firebaseUid })
      })
      setUser(null)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const register = useCallback(async (input: { name?: string; email?: string; password?: string; role: UserRole; isDemo?: boolean; firebaseIdToken?: string }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      })
      const result = await res.json()
      if (result.success) {
        if (input.isDemo) {
          setUser(result.data as IUserPublic)
        }
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: "Network error" }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        refreshProfile,
        globalIsDemo,
        setGlobalIsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
