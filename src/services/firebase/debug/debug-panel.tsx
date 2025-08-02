"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Bug, RefreshCw } from "lucide-react"
import { useAuth } from "../auth/context/auth-context"
import { useReceitas } from "@/src/core/hooks/use-receitas"
import { useDespesas } from "@/src/core/hooks/use-despesas"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const { receitas, loading: loadingReceitas, refetch: refetchReceitas } = useReceitas()
  const { despesas, loading: loadingDespesas, refetch: refetchDespesas } = useDespesas()

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="outline"
          className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
        >
          <Bug className="h-4 w-4" />
        </Button>
      ) : (
        <Card className="w-80 max-h-96 overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Debug Panel
              <Button onClick={() => setIsOpen(false)} size="sm" variant="ghost">
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <strong>User:</strong> {user ? user.uid : "Not logged in"}
            </div>
            <div>
              <strong>Email:</strong> {user?.email || "N/A"}
            </div>
            <div>
              <strong>Receitas:</strong> {receitas.length} items
              {loadingReceitas && " (Loading...)"}
            </div>
            <div>
              <strong>Despesas:</strong> {despesas.length} items
              {loadingDespesas && " (Loading...)"}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  refetchReceitas()
                  refetchDespesas()
                }}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="pt-2 border-t">
              <strong>Last 3 Receitas:</strong>
              {receitas.slice(0, 3).map((r) => (
                <div key={r.id} className="text-xs text-muted-foreground">
                  {r.descricao} - R$ {r.valor}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
