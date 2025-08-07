"use client"


import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Church } from "lucide-react"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading) {
      if (user) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, loading, router, mounted])

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center mb-4">
          <Church className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-2xl font-bold">Sistema Financeiro</h1>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Carregando..</p>
      </div>
    )
  }

  return null
}
