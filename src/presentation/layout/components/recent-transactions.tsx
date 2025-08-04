"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RecentTransactionsProps } from "@/src/core/@types/props/RecentTransactionsProps"

import { useMemo } from "react"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function RecentTransactions({ receitas, despesas }: RecentTransactionsProps) {
  const recentTransactions = useMemo(() => {
    const allTransactions = [
      ...receitas.map((r) => ({ ...r, type: "receita" as const })),
      ...despesas.map((d) => ({ ...d, type: "despesa" as const })),
    ]

    return allTransactions
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5)
  }, [receitas, despesas])

  if (recentTransactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Nenhuma transação encontrada
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {recentTransactions.map((transaction, index) => {
        const isReceita = transaction.type === "receita"
        return (
          <motion.div
            key={`${transaction.type}-${transaction.id}`}
            className="flex items-center p-3 rounded-md bg-muted/50 hover:bg-muted transition-all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {isReceita ? <ArrowUpCircle className="text-green-500" /> : <ArrowDownCircle className="text-red-500" />}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 flex-1">
              <p className="text-sm font-semibold leading-none">
                {transaction.descricao}
              </p>
              <p className="text-sm text-muted-foreground">
                {isReceita ? "Recebido de" : "Pago para"} {transaction.categoria} •{" "}
                {new Date(transaction.data).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div
              className={cn(
                "ml-auto text-sm font-bold",
                isReceita ? "text-green-600" : "text-red-600"
              )}
            >
              {isReceita ? "+" : "-"}R${" "}
              {transaction.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
