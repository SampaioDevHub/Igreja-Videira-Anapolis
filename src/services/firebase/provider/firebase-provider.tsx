"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Church } from "lucide-react"
import { firebaseService } from "../config/firebase"
import { FirebaseProviderProps } from "@/src/core/@types/props/FirebaseProviderProps"

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check if already initialized
        if (firebaseService.isInitialized()) {
          setIsInitialized(true)
          setIsLoading(false)
          return
        }

        // Initialize Firebase
        await firebaseService.initialize()

        // Additional delay to ensure everything is ready
        await new Promise((resolve) => setTimeout(resolve, 500))

        setIsInitialized(true)
      } catch (err) {
        console.error("Firebase initialization failed:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize Firebase")
      } finally {
        setIsLoading(false)
      }
    }

    initializeFirebase()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🔥</div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Erro de Inicialização do Firebase</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{error}</p>

            <div className="text-left bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4">
              <p className="text-sm font-medium mb-2">Possíveis soluções:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
                <li>Verifique se o projeto Firebase está ativo</li>
                <li>Confirme se Authentication está habilitado</li>
                <li>Certifique-se de que o Firestore foi criado</li>
                <li>Recarregue a página</li>
              </ul>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Church className="h-10 w-10 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Igreja Videira</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Sistema Financeiro</p>
            </div>
          </div>

          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-blue-600 text-2xl">🔥</div>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-2">Inicializando Firebase...</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Conectando aos serviços</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
