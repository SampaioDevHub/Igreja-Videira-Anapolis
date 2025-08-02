"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDespesas } from "@/src/core/hooks/use-despesas"
import { useReceitas } from "@/src/core/hooks/use-receitas"
import { Overview } from "@/src/presentation/layout/components/overview"
import { RecentTransactions } from "@/src/presentation/layout/components/recent-transactions"
import { DollarSign, TrendingDown, TrendingUp, Users } from "lucide-react"

import { useMemo } from "react"

export default function DashboardPage() {
  const { receitas, loading: loadingReceitas } = useReceitas()
  const { despesas, loading: loadingDespesas } = useDespesas()

  const stats = useMemo(() => {
    const totalReceitas = receitas.reduce((sum, receita) => sum + receita.valor, 0)
    const totalDespesas = despesas.reduce((sum, despesa) => sum + despesa.valor, 0)
    const totalDizimos = receitas
      .filter((receita) => receita.categoria.toLowerCase() === "dizimo")
      .reduce((sum, receita) => sum + receita.valor, 0)

    return {
      totalReceitas,
      totalDespesas,
      totalDizimos,
      saldoLiquido: totalReceitas - totalDespesas,
    }
  }, [receitas, despesas])

  if (loadingReceitas || loadingDespesas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{receitas.length} transações registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{despesas.length} despesas registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dízimos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalDizimos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {receitas.filter((r) => r.categoria.toLowerCase() === "dizimo").length} dízimos registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.saldoLiquido >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {stats.saldoLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview receitas={receitas} despesas={despesas} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>Suas {receitas.length + despesas.length} transações mais recentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions receitas={receitas} despesas={despesas} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
