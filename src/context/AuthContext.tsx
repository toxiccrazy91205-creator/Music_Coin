"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import {
  login as loginAction,
  logout as logoutAction,
  getProfile as getProfileAction,
  register as registerAction,
} from "@/lib/auth/auth"
import type { IUserPublic, UserRole } from "@/types"

interface AuthContextType {
  user: IUserPublic | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    try {
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
    refreshProfile()
  }, [refreshProfile])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginAction({ email, password })
    if (result.success) {
      setUser(result.data)
      return { success: true }
    }
    return { success: false, error: result.error }
  }, [])

  const logout = useCallback(async () => {
    await logoutAction()
    setUser(null)
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole) => {
      const result = await registerAction({ name, email, password, role })
      if (result.success) {
        setUser(result.data)
        return { success: true }
      }
      return { success: false, error: result.error }
    },
    []
  )

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
