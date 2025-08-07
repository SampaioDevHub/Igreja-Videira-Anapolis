"use client"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, TrendingUp, TrendingDown, LucidePieChart, BarChart3 } from 'lucide-react'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
} from "recharts"
import { useReceitas } from "@/src/core/hooks/use-receitas"
import { useDespesas } from "@/src/core/hooks/use-despesas"
import { PDFGenerator } from "@/src/services/firebase/Modulo-Pdf/pdf-generator"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export default function RelatoriosPage() {
  const [tipoRelatorio, setTipoRelatorio] = useState("geral")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [periodo, setPeriodo] = useState("mes-atual")

  const { receitas, loading: loadingReceitas } = useReceitas()
  const { despesas, loading: loadingDespesas } = useDespesas()


  const dadosRelatorio = useMemo(() => {
    let tempReceitas = [...receitas];
    let tempDespesas = [...despesas];

    // 1. Aplicar filtro de Período
    if (periodo !== "todos") {
      if (periodo === "personalizado") {
        if (dataInicio && dataFim) {
          tempReceitas = tempReceitas.filter((r) => r.data >= dataInicio && r.data <= dataFim);
          tempDespesas = tempDespesas.filter((d) => d.data >= dataInicio && d.data <= dataFim);
        }
      } else {
        const hoje = new Date();
        let dataLimite: Date;

        switch (periodo) {
          case "mes-atual":
            dataLimite = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            break;
          case "trimestre":
            dataLimite = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
            break;
          case "semestre":
            dataLimite = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1);
            break;
          case "ano-atual":
            dataLimite = new Date(hoje.getFullYear(), 0, 1);
            break;
          default:
            dataLimite = new Date(0); // Fallback, should not be reached with current options
        }
        tempReceitas = tempReceitas.filter((r) => new Date(r.data) >= dataLimite);
        tempDespesas = tempDespesas.filter((d) => new Date(d.data) >= dataLimite);
      }
    }

    // 2. Aplicar filtro de Tipo de Relatório
    let receitasFiltradas = tempReceitas;
    let despesasFiltradas = tempDespesas;

    switch (tipoRelatorio) {
      case "receitas":
        despesasFiltradas = []; // Mostrar apenas receitas
        break;
      case "despesas":
        receitasFiltradas = []; // Mostrar apenas despesas
        break;
      case "dizimos":
        // Assumindo que o objeto de receita tem uma propriedade 'tipo' (ex: r.tipo === 'dizimo')
        receitasFiltradas = receitasFiltradas.filter((r) => r.tipo === "dizimo");
        despesasFiltradas = [];
        break;
      case "ofertas":
        // Assumindo que o objeto de receita tem uma propriedade 'tipo' (ex: r.tipo === 'oferta')
        receitasFiltradas = receitasFiltradas.filter((r) => r.tipo === "oferta");
        despesasFiltradas = [];
        break;
      case "geral":
      default:
        // Nenhum filtro adicional necessário, usar tempReceitas e tempDespesas
        break;
    }

    return { receitasFiltradas, despesasFiltradas };
  }, [receitas, despesas, periodo, dataInicio, dataFim, tipoRelatorio]);

  const estatisticas = useMemo(() => {
    const { receitasFiltradas, despesasFiltradas } = dadosRelatorio

    const totalReceitas = receitasFiltradas.reduce((sum, r) => sum + r.valor, 0)
    const totalDespesas = despesasFiltradas.reduce((sum, d) => sum + d.valor, 0)
    const saldoLiquido = totalReceitas - totalDespesas

    // Receitas por categoria
    const receitasPorCategoria = receitasFiltradas.reduce(
      (acc, r) => {
        acc[r.categoria] = (acc[r.categoria] || 0) + r.valor
        return acc
      },
      {} as Record<string, number>,
    )

    // Despesas por categoria
    const despesasPorCategoria = despesasFiltradas.reduce(
      (acc, d) => {
        acc[d.categoria] = (acc[d.categoria] || 0) + d.valor
        return acc
      },
      {} as Record<string, number>,
    )

    // Despesas por status
    const despesasPorStatus = despesasFiltradas.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + d.valor
        return acc
      },
      {} as Record<string, number>,
    )

    // Dados mensais para gráfico de linha
    const dadosMensais: { [key: string]: { receitas: number; despesas: number } } = {}

    receitasFiltradas.forEach((receita) => {
      const date = new Date(receita.data)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (!dadosMensais[monthKey]) {
        dadosMensais[monthKey] = { receitas: 0, despesas: 0 }
      }
      dadosMensais[monthKey].receitas += receita.valor
    })

    despesasFiltradas.forEach((despesa) => {
      const date = new Date(despesa.data)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (!dadosMensais[monthKey]) {
        dadosMensais[monthKey] = { receitas: 0, despesas: 0 }
      }
      dadosMensais[monthKey].despesas += despesa.valor
    })

    const evolutionData = Object.entries(dadosMensais)
      .map(([month, values]) => ({
        mes: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        receitas: values.receitas,
        despesas: values.despesas,
        saldo: values.receitas - values.despesas,
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes))

    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido,
      receitasPorCategoria,
      despesasPorCategoria,
      despesasPorStatus,
      quantidadeReceitas: receitasFiltradas.length,
      quantidadeDespesas: despesasFiltradas.length,
      evolutionData,
    }
  }, [dadosRelatorio])

  const gerarRelatorioPDF = async () => {
    try {
      const pdfGenerator = new PDFGenerator()
      const { receitasFiltradas, despesasFiltradas } = dadosRelatorio

      const periodText =
        periodo === "personalizado" ? `${dataInicio} a ${dataFim}` : periodo.replace("-", " ").toUpperCase()

      pdfGenerator.generateFinancialReport(
        receitas, // allReceitas
        despesas, // allDespesas
        receitasFiltradas, // filteredReceitas
        despesasFiltradas, // filteredDespesas
        {
          title: "RELATÓRIO FINANCEIRO COMPLETO",
          subtitle: "Igreja Videira - Sistema de Gestão Financeira",
          period: periodText,
          includeCharts: true,
        }
      )

      pdfGenerator.save(`relatorio-financeiro-${new Date().toISOString().split("T")[0]}.pdf`)

      alert({
        title: "Relatório PDF gerado!",
        description: "O relatório foi baixado com sucesso.",
      })
    } catch (error) {
      alert({
        title: "Erro",
        description: "Erro ao gerar relatório PDF.",
        variant: "destructive",
      })
    }
  }

  // Dados para gráficos
  const pieDataReceitas = Object.entries(estatisticas.receitasPorCategoria).map(([categoria, valor]) => ({
    name: categoria,
    value: valor,
  }))

  const pieDataDespesas = Object.entries(estatisticas.despesasPorCategoria).map(([categoria, valor]) => ({
    name: categoria,
    value: valor,
  }))

  const barDataComparison = [
    {
      categoria: "Receitas",
      valor: estatisticas.totalReceitas,
    },
    {
      categoria: "Despesas",
      valor: estatisticas.totalDespesas,
    },
    {
      categoria: "Saldo",
      valor: estatisticas.saldoLiquido,
    },
  ]

  if (loadingReceitas || loadingDespesas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Relatórios Avançados
          </h1>
          <p className="text-muted-foreground">Análises detalhadas e relatórios em PDF</p>
        </div>
        <Button onClick={gerarRelatorioPDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Baixar PDF Completo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações do Relatório</CardTitle>
          <CardDescription>Configure os parâmetros para análise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Relatório</Label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Relatório Geral</SelectItem>
                  <SelectItem value="receitas">Apenas Receitas</SelectItem>
                  <SelectItem value="despesas">Apenas Despesas</SelectItem>
                  <SelectItem value="dizimos">Apenas Dízimos</SelectItem>
                  <SelectItem value="ofertas">Apenas Ofertas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodo">Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes-atual">Mês Atual</SelectItem>
                  <SelectItem value="trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="semestre">Último Semestre</SelectItem>
                  <SelectItem value="ano-atual">Ano Atual</SelectItem>
                  <SelectItem value="todos">Todos os Registros</SelectItem>
                  <SelectItem value="personalizado">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodo === "personalizado" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Fim</Label>
                  <Input id="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {estatisticas.totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{estatisticas.quantidadeReceitas} transações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {estatisticas.totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{estatisticas.quantidadeDespesas} transações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${estatisticas.saldoLiquido >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {estatisticas.saldoLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{estatisticas.saldoLiquido >= 0 ? "Superávit" : "Déficit"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem</CardTitle>
            <LucidePieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estatisticas.totalReceitas > 0
                ? `${((estatisticas.saldoLiquido / estatisticas.totalReceitas) * 100).toFixed(1)}%`
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">Margem líquida</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="graficos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="graficos" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Comparativo Geral</CardTitle>
              </CardHeader>
              <CardContent>


                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barDataComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="categoria"
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      axisLine={{ stroke: "#E5E7EB" }}
                      tickLine={{ stroke: "#E5E7EB" }}
                    />
                    <YAxis
                      tickFormatter={(value) => `R$${value}`}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      axisLine={{ stroke: "#E5E7EB" }}
                      tickLine={{ stroke: "#E5E7EB" }}
                    />
                    <Tooltip
                      formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      labelStyle={{ color: "#4B5563", fontWeight: "bold" }}
                      contentStyle={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
                    />

                    <Legend />
                    <Bar dataKey="valor" fill="#4F46E5" barSize={40} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>


              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receitas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieDataReceitas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieDataReceitas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                        "Valor",
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieDataDespesas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieDataDespesas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                        "Valor",
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status das Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(estatisticas.despesasPorStatus).map(([status, valor]) => ({
                        name: status,
                        value: valor,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {Object.keys(estatisticas.despesasPorStatus).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receitas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(estatisticas.receitasPorCategoria).map(([categoria, valor]) => (
                    <div key={categoria} className="flex items-center justify-between">
                      <span className="capitalize font-medium">{categoria}</span>
                      <span className="text-green-600 font-bold">
                        R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  {Object.keys(estatisticas.receitasPorCategoria).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Nenhuma receita no período selecionado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(estatisticas.despesasPorCategoria).map(([categoria, valor]) => (
                    <div key={categoria} className="flex items-center justify-between">
                      <span className="capitalize font-medium">{categoria}</span>
                      <span className="text-red-600 font-bold">
                        R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  {Object.keys(estatisticas.despesasPorCategoria).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Nenhuma despesa no período selecionado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Despesas por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(estatisticas.despesasPorStatus).map(([status, valor]) => (
                  <div key={status} className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-semibold capitalize">{status}</div>
                    <div
                      className={`text-2xl font-bold ${status === "Pago"
                        ? "text-green-600"
                        : status === "Pendente"
                          ? "text-yellow-600"
                          : "text-red-600"
                        }`}
                    >
                      R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolucao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Financeira</CardTitle>
              <CardDescription>Acompanhe a evolução das receitas e despesas ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={estatisticas.evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => `R$${value}`} />
                  <Tooltip
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      "Valor",
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="receitas" stroke="#00C49F" strokeWidth={2} name="Receitas" />
                  <Line type="monotone" dataKey="despesas" stroke="#FF8042" strokeWidth={2} name="Despesas" />
                  <Line type="monotone" dataKey="saldo" stroke="#8884D8" strokeWidth={2} name="Saldo" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Área de Saldo</CardTitle>
              <CardDescription>Visualização em área do saldo líquido mensal</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={estatisticas.evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => `R$${value}`} />
                  <Tooltip
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      "Saldo",
                    ]}
                  />
                  <Area type="monotone" dataKey="saldo" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
