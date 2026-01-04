"use client"

import { useMemo, useState } from "react"
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Empty,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  notification,
} from "antd"
import type { TabsProps } from "antd"
import {
  AreaChartOutlined,
  BarChartOutlined,
  DownloadOutlined,
  FallOutlined,
  FileTextOutlined,
  FilterOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RiseOutlined,
} from "@ant-design/icons"
import ReactECharts from "echarts-for-react"
import dayjs from "dayjs"
import { useTheme } from "next-themes"

import { useReceitas } from "@/src/core/hooks/use-receitas"
import { getAntdTheme } from "@/components/antd-theme"
import { useDespesas } from "@/src/core/hooks/use-despesas"
import { PDFGenerator } from "@/src/services/firebase/Modulo-Pdf/pdf-generator"

const CHART_COLORS = ["#1F4E79", "#2E75B6", "#4B8ED1", "#6FA8DC", "#8FBCE6", "#34D399", "#F59E0B", "#EF4444"]
const STATUS_COLORS: Record<string, string> = {
  Pago: "#16a34a",
  Pendente: "#f59e0b",
  Vencido: "#dc2626",
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
})
const compactFormatter = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const formatCurrency = (value: number) => currencyFormatter.format(value || 0)
const formatCompactCurrency = (value: number) => `R$ ${compactFormatter.format(value || 0)}`
const formatPercent = (value: number) => percentFormatter.format(value || 0)

const parseLocalDateString = (value: string) =>
  new Date(value.includes("T") ? value : `${value}T00:00:00`)

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

type CategoriaRow = {
  key: string
  categoria: string
  valor: number
  percentual: number
}

export default function RelatoriosPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [notificationApi, notificationContextHolder] = notification.useNotification()

  const [tipoRelatorio, setTipoRelatorio] = useState("geral")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [periodo, setPeriodo] = useState("todos")

  const { receitas, loading: loadingReceitas } = useReceitas()
  const { despesas, loading: loadingDespesas } = useDespesas()

  const tipoLabels: Record<string, string> = {
    geral: "Relatario geral",
    receitas: "Receitas",
    despesas: "Despesas",
    dizimos: "Dízimos",
    "dizimos-ofertas": "Dízimos e ofertas",
    ofertas: "Ofertas",
  }

const periodoLabels: Record<string, string> = {
  "mes-atual": "Mês atual",
  trimestre: "Último trimestre",
  semestre: "Último semestre",
  "ano-atual": "Ano atual",
  todos: "Todos os registros",
  personalizado: "Período personalizado",
}


  const handlePeriodoChange = (value: string) => {
    setPeriodo(value)
    if (value !== "personalizado") {
      setDataInicio("")
      setDataFim("")
    }
  }

  const dadosRelatorio = useMemo(() => {
    let tempReceitas = [...receitas]
    let tempDespesas = [...despesas]

    if (periodo !== "todos") {
      if (periodo === "personalizado") {
        if (dataInicio && dataFim) {
          tempReceitas = tempReceitas.filter((r) => r.data >= dataInicio && r.data <= dataFim)
          tempDespesas = tempDespesas.filter((d) => d.data >= dataInicio && d.data <= dataFim)
        }
      } else {
        const hoje = new Date()
        let dataLimite: Date

        switch (periodo) {
          case "mes-atual":
            dataLimite = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
            break
          case "trimestre":
            dataLimite = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1)
            break
          case "semestre":
            dataLimite = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1)
            break
          case "ano-atual":
            dataLimite = new Date(hoje.getFullYear(), 0, 1)
            break
          default:
            dataLimite = new Date(0)
        }

        tempReceitas = tempReceitas.filter((r) => parseLocalDateString(r.data) >= dataLimite)
        tempDespesas = tempDespesas.filter((d) => parseLocalDateString(d.data) >= dataLimite)
      }
    }

    let receitasFiltradas = tempReceitas
    let despesasFiltradas = tempDespesas

    switch (tipoRelatorio) {
      case "receitas":
        despesasFiltradas = []
        break
      case "despesas":
        receitasFiltradas = []
        break
      case "dizimos":
        receitasFiltradas = receitasFiltradas.filter((r) => normalizeText(r.categoria || "") === "dizimo")
        despesasFiltradas = []
        break
      case "dizimos-ofertas":
        receitasFiltradas = receitasFiltradas.filter((r) => {
          const categoria = normalizeText(r.categoria || "")
          return categoria === "dizimo" || categoria === "oferta"
        })
        despesasFiltradas = []
        break
      case "ofertas":
        receitasFiltradas = receitasFiltradas.filter((r) => normalizeText(r.categoria || "") === "oferta")
        despesasFiltradas = []
        break
      default:
        break
    }

    return { receitasFiltradas, despesasFiltradas }
  }, [receitas, despesas, periodo, dataInicio, dataFim, tipoRelatorio])

  const estatisticas = useMemo(() => {
    const { receitasFiltradas, despesasFiltradas } = dadosRelatorio

    const totalReceitas = receitasFiltradas.reduce((sum, r) => sum + r.valor, 0)
    const totalDespesas = despesasFiltradas.reduce((sum, d) => sum + d.valor, 0)
    const saldoLiquido = totalReceitas - totalDespesas

    const receitasPorCategoria = receitasFiltradas.reduce(
      (acc, r) => {
        acc[r.categoria] = (acc[r.categoria] || 0) + r.valor
        return acc
      },
      {} as Record<string, number>,
    )

    const despesasPorCategoria = despesasFiltradas.reduce(
      (acc, d) => {
        acc[d.categoria] = (acc[d.categoria] || 0) + d.valor
        return acc
      },
      {} as Record<string, number>,
    )

    const despesasPorStatus = despesasFiltradas.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + d.valor
        return acc
      },
      {} as Record<string, number>,
    )

    const dadosMensais: { [key: string]: { receitas: number; despesas: number } } = {}

    receitasFiltradas.forEach((receita) => {
      const date = parseLocalDateString(receita.data)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (!dadosMensais[monthKey]) {
        dadosMensais[monthKey] = { receitas: 0, despesas: 0 }
      }
      dadosMensais[monthKey].receitas += receita.valor
    })

    despesasFiltradas.forEach((despesa) => {
      const date = parseLocalDateString(despesa.data)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (!dadosMensais[monthKey]) {
        dadosMensais[monthKey] = { receitas: 0, despesas: 0 }
      }
      dadosMensais[monthKey].despesas += despesa.valor
    })

    const evolutionData = Object.entries(dadosMensais)
      .map(([month, values]) => ({
        key: month,
        mes: new Date(`${month}-01`).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        receitas: values.receitas,
        despesas: values.despesas,
        saldo: values.receitas - values.despesas,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))

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

  const margemLiquida = estatisticas.totalReceitas > 0 ? (estatisticas.saldoLiquido / estatisticas.totalReceitas) * 100 : 0
  const periodLabel =
    periodo === "personalizado" && dataInicio && dataFim
      ? `${parseLocalDateString(dataInicio).toLocaleDateString("pt-BR")} a ${parseLocalDateString(dataFim).toLocaleDateString("pt-BR")}`
      : periodoLabels[periodo] || "Todos os registros"
  const tipoLabel = tipoLabels[tipoRelatorio] || "Relatório geral"


  const gerarRelatorioPDF = async () => {
    try {
      const pdfGenerator = new PDFGenerator()
      const { receitasFiltradas, despesasFiltradas } = dadosRelatorio
      const periodText =
        periodo === "personalizado" && dataInicio && dataFim
          ? `${parseLocalDateString(dataInicio).toLocaleDateString("pt-BR")} a ${parseLocalDateString(dataFim).toLocaleDateString("pt-BR")}`
          : periodoLabels[periodo] || "Todos os registros"

      pdfGenerator.generateFinancialReport(
        receitas,
        despesas,
        receitasFiltradas,
        despesasFiltradas,
       {
  title: "RELATÓRIO FINANCEIRO COMPLETO",
  subtitle: "Igreja Videira - Sistema de Gestão Financeira",
  period: periodText,
  includeCharts: true,
}

      )

      pdfGenerator.save(`relatorio-financeiro-${new Date().toISOString().split("T")[0]}.pdf`)

     notificationApi.success({
  message: "Relatório PDF gerado",
  description: "O relatório foi baixado com sucesso.",
  placement: "topRight",
})

   } catch (error) {
  notificationApi.error({
    message: "Erro ao gerar relatório",
    description: "Não foi possível gerar o relatório PDF no momento.",
    placement: "topRight",
  })
}

  }

  const receitasPorCategoriaData = useMemo(
    () =>
      Object.entries(estatisticas.receitasPorCategoria)
        .map(([categoria, valor]) => ({ name: categoria, value: valor }))
        .sort((a, b) => b.value - a.value),
    [estatisticas.receitasPorCategoria],
  )

  const despesasPorCategoriaData = useMemo(
    () =>
      Object.entries(estatisticas.despesasPorCategoria)
        .map(([categoria, valor]) => ({ name: categoria, value: valor }))
        .sort((a, b) => b.value - a.value),
    [estatisticas.despesasPorCategoria],
  )

  const statusData = useMemo(
    () =>
      Object.entries(estatisticas.despesasPorStatus).map(([status, valor]) => ({
        name: status,
        value: valor,
      })),
    [estatisticas.despesasPorStatus],
  )

  const receitaTableData: CategoriaRow[] = useMemo(
    () =>
      receitasPorCategoriaData.map((item, index) => ({
        key: `${item.name}-${index}`,
        categoria: item.name,
        valor: item.value,
        percentual: estatisticas.totalReceitas > 0 ? (item.value / estatisticas.totalReceitas) * 100 : 0,
      })),
    [receitasPorCategoriaData, estatisticas.totalReceitas],
  )

  const despesaTableData: CategoriaRow[] = useMemo(
    () =>
      despesasPorCategoriaData.map((item, index) => ({
        key: `${item.name}-${index}`,
        categoria: item.name,
        valor: item.value,
        percentual: estatisticas.totalDespesas > 0 ? (item.value / estatisticas.totalDespesas) * 100 : 0,
      })),
    [despesasPorCategoriaData, estatisticas.totalDespesas],
  )

  const axisLabelColor = isDark ? "#E2E8F0" : "#475569"
  const gridLineColor = isDark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.08)"
  const tooltipBackground = isDark ? "rgba(15, 23, 42, 0.92)" : "#ffffff"
  const tooltipBorder = isDark ? "#334155" : "#E2E8F0"
  const tooltipTextColor = isDark ? "#F8FAFC" : "#0F172A"

  const comparisonOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (value: number) => formatCurrency(value),
        backgroundColor: tooltipBackground,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipTextColor },
      },
      grid: { left: 16, right: 16, top: 24, bottom: 12, containLabel: true },
      xAxis: {
        type: "category",
        data: ["Receitas", "Despesas", "Saldo"],
        axisLabel: { color: axisLabelColor },
        axisLine: { lineStyle: { color: gridLineColor } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: axisLabelColor, formatter: (value: number) => formatCompactCurrency(value) },
        splitLine: { lineStyle: { color: gridLineColor } },
      },
      series: [
        {
          type: "bar",
          barWidth: 36,
          data: [
            { value: estatisticas.totalReceitas, itemStyle: { color: CHART_COLORS[0] } },
            { value: estatisticas.totalDespesas, itemStyle: { color: CHART_COLORS[7] } },
            { value: estatisticas.saldoLiquido, itemStyle: { color: CHART_COLORS[2] } },
          ],
          label: {
            show: true,
            position: "top",
            formatter: ({ value }: { value: number }) => formatCompactCurrency(value),
            color: axisLabelColor,
          },
        },
      ],
    }),
    [
      axisLabelColor,
      gridLineColor,
      tooltipBackground,
      tooltipBorder,
      tooltipTextColor,
      estatisticas.totalReceitas,
      estatisticas.totalDespesas,
      estatisticas.saldoLiquido,
    ],
  )

  const receitasPieOption = useMemo(
    () => {
      const useSideLegend = receitasPorCategoriaData.length > 6
      return {
        tooltip: {
          trigger: "item",
          formatter: (params: { name: string; value: number; percent: number }) =>
            `${params.name}<br/>${formatCurrency(params.value)} (${formatPercent(params.percent)}%)`,
          backgroundColor: tooltipBackground,
          borderColor: tooltipBorder,
          textStyle: { color: tooltipTextColor },
        },
        legend: useSideLegend
          ? {
              type: "scroll",
              orient: "vertical",
              right: 8,
              top: 16,
              bottom: 16,
              width: 160,
              textStyle: { color: axisLabelColor },
              pageIconColor: axisLabelColor,
              pageIconInactiveColor: isDark ? "#475569" : "#CBD5F5",
              pageTextStyle: { color: axisLabelColor },
            }
          : {
              bottom: 0,
              textStyle: { color: axisLabelColor },
            },
        series: [
          {
            name: "Receitas",
            type: "pie",
            radius: useSideLegend ? ["40%", "65%"] : ["45%", "70%"],
            center: useSideLegend ? ["35%", "50%"] : ["50%", "42%"],
            avoidLabelOverlap: true,
            label: { show: false },
            data: receitasPorCategoriaData,
          },
        ],
        color: CHART_COLORS,
      }
    },
    [
      axisLabelColor,
      receitasPorCategoriaData,
      tooltipBackground,
      tooltipBorder,
      tooltipTextColor,
      isDark,
    ],
  )

  const despesasPieOption = useMemo(
    () => {
      const useSideLegend = despesasPorCategoriaData.length > 6
      return {
        tooltip: {
          trigger: "item",
          formatter: (params: { name: string; value: number; percent: number }) =>
            `${params.name}<br/>${formatCurrency(params.value)} (${formatPercent(params.percent)}%)`,
          backgroundColor: tooltipBackground,
          borderColor: tooltipBorder,
          textStyle: { color: tooltipTextColor },
        },
        legend: useSideLegend
          ? {
              type: "scroll",
              orient: "vertical",
              right: 8,
              top: 16,
              bottom: 16,
              width: 160,
              textStyle: { color: axisLabelColor },
              pageIconColor: axisLabelColor,
              pageIconInactiveColor: isDark ? "#475569" : "#CBD5F5",
              pageTextStyle: { color: axisLabelColor },
            }
          : {
              bottom: 0,
              textStyle: { color: axisLabelColor },
            },
        series: [
          {
            name: "Despesas",
            type: "pie",
            radius: useSideLegend ? ["40%", "65%"] : ["45%", "70%"],
            center: useSideLegend ? ["35%", "50%"] : ["50%", "42%"],
            avoidLabelOverlap: true,
            label: { show: false },
            data: despesasPorCategoriaData,
          },
        ],
        color: CHART_COLORS,
      }
    },
    [
      axisLabelColor,
      despesasPorCategoriaData,
      tooltipBackground,
      tooltipBorder,
      tooltipTextColor,
      isDark,
    ],
  )

  const statusOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (value: number) => formatCurrency(value),
        backgroundColor: tooltipBackground,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipTextColor },
      },
      grid: { left: 80, right: 24, top: 16, bottom: 16, containLabel: true },
      xAxis: {
        type: "value",
        splitNumber: 4,
        axisLabel: {
          color: axisLabelColor,
          formatter: (value: number) => compactFormatter.format(value || 0),
          hideOverlap: true,
          margin: 12,
        },
        axisLine: { lineStyle: { color: gridLineColor } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: gridLineColor } },
      },
      yAxis: {
        type: "category",
        data: statusData.map((item) => item.name),
        axisLabel: { color: axisLabelColor },
      },
      series: [
        {
          type: "bar",
          data: statusData.map((item) => ({
            value: item.value,
            itemStyle: { color: STATUS_COLORS[item.name] || CHART_COLORS[0] },
          })),
          barWidth: 18,
          label: {
            show: true,
            position: "right",
            formatter: ({ value }: { value: number }) => formatCompactCurrency(value),
            color: axisLabelColor,
          },
        },
      ],
    }),
    [
      axisLabelColor,
      gridLineColor,
      statusData,
      tooltipBackground,
      tooltipBorder,
      tooltipTextColor,
    ],
  )

  const evolutionOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        valueFormatter: (value: number) => formatCurrency(value),
        backgroundColor: tooltipBackground,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipTextColor },
      },
      legend: {
        bottom: 0,
        textStyle: { color: axisLabelColor },
      },
      grid: { left: 16, right: 16, top: 24, bottom: 36, containLabel: true },
      xAxis: {
        type: "category",
        data: estatisticas.evolutionData.map((item) => item.mes),
        axisLabel: { color: axisLabelColor },
        axisLine: { lineStyle: { color: gridLineColor } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: axisLabelColor, formatter: (value: number) => formatCompactCurrency(value) },
        splitLine: { lineStyle: { color: gridLineColor } },
      },
      series: [
        {
          name: "Receitas",
          type: "line",
          smooth: true,
          data: estatisticas.evolutionData.map((item) => item.receitas),
          lineStyle: { width: 3 },
          symbol: "circle",
          symbolSize: 6,
        },
        {
          name: "Despesas",
          type: "line",
          smooth: true,
          data: estatisticas.evolutionData.map((item) => item.despesas),
          lineStyle: { width: 3 },
          symbol: "circle",
          symbolSize: 6,
        },
        {
          name: "Saldo",
          type: "line",
          smooth: true,
          data: estatisticas.evolutionData.map((item) => item.saldo),
          lineStyle: { width: 3 },
          symbol: "circle",
          symbolSize: 6,
        },
      ],
      color: [CHART_COLORS[0], CHART_COLORS[7], CHART_COLORS[2]],
    }),
    [
      axisLabelColor,
      gridLineColor,
      tooltipBackground,
      tooltipBorder,
      tooltipTextColor,
      estatisticas.evolutionData,
    ],
  )

  const saldoAreaOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        valueFormatter: (value: number) => formatCurrency(value),
        backgroundColor: tooltipBackground,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipTextColor },
      },
      grid: { left: 16, right: 16, top: 24, bottom: 16, containLabel: true },
      xAxis: {
        type: "category",
        data: estatisticas.evolutionData.map((item) => item.mes),
        axisLabel: { color: axisLabelColor },
        axisLine: { lineStyle: { color: gridLineColor } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: axisLabelColor, formatter: (value: number) => formatCompactCurrency(value) },
        splitLine: { lineStyle: { color: gridLineColor } },
      },
      series: [
        {
          name: "Saldo",
          type: "line",
          smooth: true,
          data: estatisticas.evolutionData.map((item) => item.saldo),
          lineStyle: { width: 3, color: CHART_COLORS[2] },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(46, 117, 182, 0.35)" },
                { offset: 1, color: "rgba(46, 117, 182, 0.02)" },
              ],
            },
          },
          symbol: "none",
        },
      ],
    }),
    [
      axisLabelColor,
      gridLineColor,
      tooltipBackground,
      tooltipBorder,
      tooltipTextColor,
      estatisticas.evolutionData,
    ],
  )

  if (loadingReceitas || loadingDespesas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  const receitaColumns = [
    {
      title: "Categoria",
      dataIndex: "categoria",
      key: "categoria",
      render: (value: string) => <span className="capitalize">{value}</span>,
    },
    {
      title: "Valor",
      dataIndex: "valor",
      key: "valor",
      align: "right" as const,
      render: (value: number) => <span className="font-semibold text-emerald-600">{formatCurrency(value)}</span>,
    },
    {
      title: "% do total",
      dataIndex: "percentual",
      key: "percentual",
      render: (value: number) => (
        <Progress percent={Number(value.toFixed(1))} size="small" strokeColor="#16a34a" />
      ),
    },
  ]

  const despesaColumns = [
    {
      title: "Categoria",
      dataIndex: "categoria",
      key: "categoria",
      render: (value: string) => <span className="capitalize">{value}</span>,
    },
    {
      title: "Valor",
      dataIndex: "valor",
      key: "valor",
      align: "right" as const,
      render: (value: number) => <span className="font-semibold text-rose-500">{formatCurrency(value)}</span>,
    },
    {
      title: "% do total",
      dataIndex: "percentual",
      key: "percentual",
      render: (value: number) => (
        <Progress percent={Number(value.toFixed(1))} size="small" strokeColor="#ef4444" />
      ),
    },
  ]

  const tabItems: TabsProps["items"] = [
    {
      key: "visao-geral",
      label: (
        <Space>
          <BarChartOutlined />
          Visão geral
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><BarChartOutlined /> Comparativo geral</Space>}>
              {estatisticas.totalReceitas || estatisticas.totalDespesas ? (
                <ReactECharts option={comparisonOption} style={{ height: 320 }} />
              ) : (
                <Empty description="Sem dados para o período selecionado" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><PieChartOutlined /> Receitas por categoria</Space>}>
              {receitasPorCategoriaData.length ? (
                <ReactECharts option={receitasPieOption} style={{ height: 320 }} />
              ) : (
                <Empty description="Nenhuma receita no período" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><PieChartOutlined /> Despesas por categoria</Space>}>
              {despesasPorCategoriaData.length ? (
                <ReactECharts option={despesasPieOption} style={{ height: 320 }} />
              ) : (
                <Empty description="Nenhuma despesa no período" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><BarChartOutlined /> Status das despesas</Space>}>
              {statusData.length ? (
                <ReactECharts option={statusOption} style={{ height: 320 }} />
              ) : (
                <Empty description="Nenhuma despesa no período" />
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: "categorias",
      label: (
        <Space>
          <PieChartOutlined />
          Categorias
        </Space>
      ),
      children: (
        <Space direction="vertical" size="large" className="w-full">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title="Receitas por categoria"
                extra={<Tag color="green">Total {formatCurrency(estatisticas.totalReceitas)}</Tag>}
              >
                <Table
                  columns={receitaColumns}
                  dataSource={receitaTableData}
                  pagination={false}
                  locale={{ emptyText: "Nenhuma receita no período" }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title="Despesas por categoria"
                extra={<Tag color="red">Total {formatCurrency(estatisticas.totalDespesas)}</Tag>}
              >
                <Table
                  columns={despesaColumns}
                  dataSource={despesaTableData}
                  pagination={false}
                  locale={{ emptyText: "Nenhuma despesa no período" }}
                />
              </Card>
            </Col>
          </Row>
          <Card title="Status das despesas">
            {statusData.length ? (
              <Row gutter={[16, 16]}>
                {statusData.map((status) => (
                  <Col xs={24} sm={8} key={status.name}>
                    <Card size="small">
                      <Space direction="vertical">
                        <Tag color={status.name === "Pago" ? "green" : status.name === "Pendente" ? "gold" : "red"}>
                          {status.name}
                        </Tag>
                        <Statistic value={status.value} formatter={(value) => formatCurrency(Number(value))} />
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="Nenhuma despesa no período" />
            )}
          </Card>
        </Space>
      ),
    },
    {
      key: "evolucao",
      label: (
        <Space>
          <LineChartOutlined />
          Evolução
        </Space>
      ),
      children: (
        <Space direction="vertical" size="large" className="w-full">
          <Card
            title={<Space><LineChartOutlined /> Evolução financeira</Space>}
            extra={<Tag color="blue">Receitas, despesas e saldo</Tag>}
          >
            {estatisticas.evolutionData.length ? (
              <ReactECharts option={evolutionOption} style={{ height: 360 }} />
            ) : (
              <Empty description="Sem dados suficientes para evolução" />
            )}
          </Card>
          <Card
            title={<Space><AreaChartOutlined /> Área de saldo</Space>}
            extra={<Tag color={estatisticas.saldoLiquido >= 0 ? "green" : "red"}>Saldo líquido</Tag>}
          >
            {estatisticas.evolutionData.length ? (
              <ReactECharts option={saldoAreaOption} style={{ height: 300 }} />
            ) : (
              <Empty description="Sem dados suficientes para evolução" />
            )}
          </Card>
        </Space>
      ),
    },
  ]

  return (
    <ConfigProvider theme={getAntdTheme(isDark)}>
      {notificationContextHolder}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm dark:border-slate-700/70 dark:from-slate-900/70 dark:via-slate-900 dark:to-slate-800/70">
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} lg={18}>
              <Space direction="vertical" size="small">
                <Space size="middle" align="center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                    <FileTextOutlined className="text-xl" />
                  </div>
                  <div>
                    <Typography.Title level={3} className="m-0">
                      Relatórios financeiros
                    </Typography.Title>
                    <Typography.Text type="secondary">
                      Visão executiva com filtros inteligentes, métricas-chave e exportação em PDF.
                    </Typography.Text>
                  </div>
                </Space>
                <Space size="small" wrap>
                  <Tag color="blue">Período: {periodLabel}</Tag>
                  <Tag color="geekblue">Tipo: {tipoLabel}</Tag>
                  <Tag color={estatisticas.saldoLiquido >= 0 ? "green" : "red"}>
                    {estatisticas.saldoLiquido >= 0 ? "Superávit" : "Déficit"}: {formatCurrency(estatisticas.saldoLiquido)}
                  </Tag>
                </Space>
              </Space>
            </Col>
            <Col xs={24} lg={6} className="flex lg:justify-end">
              <Button type="primary" icon={<DownloadOutlined />} onClick={gerarRelatorioPDF} block>
                Baixar PDF completo
              </Button>
            </Col>
          </Row>
        </div>

        <Card title={<Space><FilterOutlined /> Filtros estratégicos</Space>}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Space direction="vertical" size={4} className="w-full">
                <Typography.Text type="secondary">Tipo de relatório</Typography.Text>
                <Select
                  value={tipoRelatorio}
                  onChange={setTipoRelatorio}
                  className="w-full"
                  options={[
                    { value: "geral", label: "Relatório geral" },
                    { value: "receitas", label: "Apenas receitas" },
                    { value: "despesas", label: "Apenas despesas" },
                    { value: "dizimos", label: "Apenas dízimos" },
                    { value: "dizimos-ofertas", label: "Dízimos e ofertas" },
                    { value: "ofertas", label: "Apenas ofertas" },
                  ]}
                />
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical" size={4} className="w-full">
                <Typography.Text type="secondary">Período</Typography.Text>
                <Select
                  value={periodo}
                  onChange={handlePeriodoChange}
                  className="w-full"
                  options={[
                    { value: "mes-atual", label: "Mês atual" },
                    { value: "trimestre", label: "Último trimestre" },
                    { value: "semestre", label: "Último semestre" },
                    { value: "ano-atual", label: "Ano atual" },
                    { value: "todos", label: "Todos os registros" },
                    { value: "personalizado", label: "Período personalizado" },
                  ]}
                />
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical" size={4} className="w-full">
                <Typography.Text type="secondary">Intervalo personalizado</Typography.Text>
                {periodo === "personalizado" ? (
                  <DatePicker.RangePicker
                    value={dataInicio && dataFim ? [dayjs(dataInicio), dayjs(dataFim)] : null}
                    onChange={(dates) => {
                      setDataInicio(dates?.[0]?.format("YYYY-MM-DD") ?? "")
                      setDataFim(dates?.[1]?.format("YYYY-MM-DD") ?? "")
                    }}
                    className="w-full"
                    format="DD/MM/YYYY"
                    placeholder={["Início", "Fim"]}
                  />
                ) : (
                  <Tag color="cyan" className="text-sm">
                    {periodLabel}
                  </Tag>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]} className="mt-2">
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Space direction="vertical">
                <Statistic
                  title="Total de receitas"
                  value={estatisticas.totalReceitas}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: "#16a34a" }}
                  prefix={<RiseOutlined />}
                />
                <Typography.Text type="secondary">{estatisticas.quantidadeReceitas} transações</Typography.Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Space direction="vertical">
                <Statistic
                  title="Total de despesas"
                  value={estatisticas.totalDespesas}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: "#ef4444" }}
                  prefix={<FallOutlined />}
                />
                <Typography.Text type="secondary">{estatisticas.quantidadeDespesas} transações</Typography.Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Space direction="vertical">
                <Statistic
                  title="Saldo líquido"
                  value={estatisticas.saldoLiquido}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: estatisticas.saldoLiquido >= 0 ? "#22c55e" : "#f97316" }}
                  prefix={<BarChartOutlined />}
                />
                <Tag color={estatisticas.saldoLiquido >= 0 ? "green" : "orange"}>
                  {estatisticas.saldoLiquido >= 0 ? "Superávit" : "Déficit"}
                </Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Space direction="vertical">
                <Statistic
                  title="Margem líquida"
                  value={margemLiquida}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: margemLiquida >= 0 ? "#1F4E79" : "#f97316" }}
                />
                <Typography.Text type="secondary">Relação entre saldo e receitas</Typography.Text>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs items={tabItems} destroyOnHidden />
        </Card>
      </div>
    </ConfigProvider>
  )
}






