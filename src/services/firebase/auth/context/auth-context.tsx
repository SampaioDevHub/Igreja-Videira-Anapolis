"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth"
import { getAuthInstance } from "../../config/firebase"
import { notificationService } from "../../Modulo-Notification/notification-service"
import { backupService } from "../../backup/backup-service"
import { AuthContextType } from "@/src/core/@types/AuthContextType"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initAuth = async () => {
      try {
        const auth = getAuthInstance()

        unsubscribe = onAuthStateChanged(
          auth,
          async (user) => {
            console.log("Auth state changed:", user ? "User logged in" : "User logged out")
            setUser(user)
            setLoading(false)

            if (user) {
              await notificationService.requestPermission()
              await backupService.scheduleAutoBackup(user.uid, 24)
              await notificationService.sendNotification({
                title: "Bem-vindo!",
                body: "Login realizado com sucesso no Sistema Financeiro",
                tag: "login",
              })
            }
          },
          (error) => {
            console.error("Auth state change error:", error)
            setLoading(false)
          },
        )
      } catch (error) {
        console.error("Auth initialization error:", error)
        setLoading(false)
      }
    }

    const timer = setTimeout(initAuth, 100)

    return () => {
      clearTimeout(timer)
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const auth = getAuthInstance()
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log("Login successful:", result.user.email)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const auth = getAuthInstance()
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName: name })
      console.log("Registration successful:", user.email)
    } catch (error) {
      console.error("Register error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const auth = getAuthInstance()
      await signOut(auth)
      console.log("Logout successful")
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  // Novo método para recuperação de senha
  const sendPasswordResetEmailHandler = async (email: string) => {
    try {
      const auth = getAuthInstance()
      await sendPasswordResetEmail(auth, email)
      console.log("Password reset email sent to:", email)
    } catch (error) {
      console.error("Password reset error:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    sendPasswordResetEmail: sendPasswordResetEmailHandler,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
