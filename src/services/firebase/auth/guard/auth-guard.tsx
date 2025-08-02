"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Church } from "lucide-react"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router, mounted])

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex items-center mb-4">
          <Church className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-xl font-semibold">Sistema Financeiro</h1>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
