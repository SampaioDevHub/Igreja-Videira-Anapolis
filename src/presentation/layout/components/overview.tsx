"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useMemo, useState } from "react"
import { OverviewProps } from "@/src/core/@types/props/OverviewProps"
import { Button } from "@/components/ui/button"

const PERIODS = ["diário", "semanal", "mensal", "anual"] as const
type PeriodType = typeof PERIODS[number]

export function Overview({ receitas, despesas }: OverviewProps) {
  const [periodo, setPeriodo] = useState<PeriodType>("mensal")

  const data = useMemo(() => {
    const groupedData: { [key: string]: { receitas: number; despesas: number } } = {}

    const getKey = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")

      switch (periodo) {
        case "diário":
          return `${year}-${month}-${day}`
        case "semanal": {
          const firstDay = new Date(date)
          firstDay.setDate(date.getDate() - date.getDay()) // domingo da semana
          return `${firstDay.getFullYear()}-W${String(
            Math.ceil((firstDay.getDate() + 6) / 7)
          ).padStart(2, "0")}`
        }
        case "mensal":
          return `${year}-${month}`
        case "anual":
          return `${year}`
      }
    }

    const processItem = (item: any, type: "receitas" | "despesas") => {
      const date = new Date(item.data)
      const key = getKey(date)

      if (!groupedData[key]) groupedData[key] = { receitas: 0, despesas: 0 }
      groupedData[key][type] += item.valor
    }

    receitas.forEach((r) => processItem(r, "receitas"))
    despesas.forEach((d) => processItem(d, "despesas"))

    return Object.entries(groupedData)
      .map(([key, values]) => {
        let label: string
        if (periodo === "anual") {
          label = key
        } else if (periodo === "mensal") {
          label = new Date(key + "-01").toLocaleDateString("pt-BR", {
            month: "short",
            year: "2-digit",
          })
        } else if (periodo === "semanal") {
          label = `Sem ${key.split("-W")[1]}/${key.split("-W")[0]}`
        } else {
          label = new Date(key).toLocaleDateString("pt-BR")
        }

        return {
          name: label,
          receitas: values.receitas,
          despesas: values.despesas,
          saldo: values.receitas - values.despesas,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-12)
  }, [receitas, despesas, periodo])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        Nenhum dado disponível para exibir
      </div>
    )
  }

  return (
    <div>
      {/* Botões de seleção de período */}
      <div className="flex justify-end gap-2 mb-4">
        {PERIODS.map((p) => (
          <Button
            key={p}
            variant={periodo === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodo(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          barCategoryGap={20}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="name"
            stroke="#666"
            fontSize={13}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#666"
            fontSize={13}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.05)" }}
            formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Saldo"]}
            labelStyle={{ fontWeight: "bold", color: "#333" }}
            contentStyle={{
              borderRadius: 8,
              borderColor: "#ccc",
              backgroundColor: "#fff",
            }}
          />
          <Legend verticalAlign="top" height={36} />
          <Bar
            dataKey="saldo"
            name="Saldo em R$"
            fill="#4caf50"
            radius={[6, 6, 0, 0]}
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
