"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RecentTransactionsProps } from "@/src/core/@types/props/RecentTransactionsProps"

import { useMemo } from "react"

export function RecentTransactions({ receitas, despesas }: RecentTransactionsProps) {
  const recentTransactions = useMemo(() => {
    const allTransactions = [
      ...receitas.map((r) => ({ ...r, type: "receita" as const })),
      ...despesas.map((d) => ({ ...d, type: "despesa" as const })),
    ]

    return allTransactions.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5)
  }, [receitas, despesas])

  if (recentTransactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">Nenhuma transação encontrada</div>
    )
  }

  return (
    <div className="space-y-8">
      {recentTransactions.map((transaction) => (
        <div key={`${transaction.type}-${transaction.id}`} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{transaction.type === "receita" ? "+" : "-"}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{transaction.descricao}</p>
            <p className="text-sm text-muted-foreground">
              {transaction.categoria} - {new Date(transaction.data).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className={`ml-auto font-medium ${transaction.type === "receita" ? "text-green-600" : "text-red-600"}`}>
            {transaction.type === "receita" ? "+" : "-"}R${" "}
            {transaction.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </div>
      ))}
    </div>
  )
}
