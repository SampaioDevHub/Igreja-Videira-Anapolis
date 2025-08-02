"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

import { useMemo } from "react"
import { Receita } from "@/src/core/hooks/use-receitas"
import { Despesa } from "@/src/core/hooks/use-despesas"

interface OverviewProps {
  receitas: Receita[]
  despesas: Despesa[]
}

export function Overview({ receitas, despesas }: OverviewProps) {
  const data = useMemo(() => {
    const monthlyData: { [key: string]: { receitas: number; despesas: number } } = {}

    receitas.forEach((receita) => {
      const date = new Date(receita.data)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { receitas: 0, despesas: 0 }
      }
      monthlyData[monthKey].receitas += receita.valor
    })

    // Processar despesas
    despesas.forEach((despesa) => {
      const date = new Date(despesa.data)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { receitas: 0, despesas: 0 }
      }
      monthlyData[monthKey].despesas += despesa.valor
    })

    // Converter para array e ordenar
    return Object.entries(monthlyData)
      .map(([month, values]) => ({
        name: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        receitas: values.receitas,
        despesas: values.despesas,
        saldo: values.receitas - values.despesas,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-12) // Últimos 12 meses
  }, [receitas, despesas])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        Nenhum dado disponível para exibir
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${value}`}
        />
        <Bar dataKey="saldo" fill="#adfa1d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
