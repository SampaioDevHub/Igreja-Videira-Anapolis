"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Card,
  Col,
  ConfigProvider,
  Empty,
  Row,
  Segmented,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd"
import type { TableProps } from "antd"
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FallOutlined,
  RiseOutlined,
} from "@ant-design/icons"
import ReactECharts from "echarts-for-react"
import { useTheme } from "next-themes"

import { useDespesas } from "@/src/core/hooks/use-despesas"
import { useReceitas } from "@/src/core/hooks/use-receitas"
import { getAntdTheme } from "@/components/antd-theme"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
})
const compactFormatter = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })

const formatCurrency = (value: number) => currencyFormatter.format(value || 0)
const formatCompactCurrency = (value: number) => `R$ ${compactFormatter.format(value || 0)}`

const parseLocalDateString = (value: string) =>
  new Date(value.includes("T") ? value : `${value}T00:00:00`)

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

const useHideValues = () => {
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("hideDizimos")
      return stored ? JSON.parse(stored) : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("hideDizimos", JSON.stringify(hidden))
    } catch {
      // ignore write errors
    }
  }, [hidden])

  return { hidden, setHidden }
}

const PERIOD_OPTIONS = [
  { label: "Diario", value: "daily" },
  { label: "Semanal", value: "weekly" },
  { label: "Mensal", value: "monthly" },
  { label: "Anual", value: "yearly" },
] as const

type PeriodValue = (typeof PERIOD_OPTIONS)[number]["value"]

const getWeekKey = (date: Date) => {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = temp.getUTCDay() || 7
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum)
  const year = temp.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${year}-W${String(week).padStart(2, "0")}`
}

export default function DashboardPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const { receitas, loading: loadingReceitas } = useReceitas()
  const { despesas, loading: loadingDespesas } = useDespesas()
  const { hidden, setHidden } = useHideValues()
  const [periodo, setPeriodo] = useState<PeriodValue>("monthly")

  const stats = useMemo(() => {
    const totalReceitas = receitas.reduce((sum, receita) => sum + receita.valor, 0)
    const totalDespesas = despesas.reduce((sum, despesa) => sum + despesa.valor, 0)
    const totalDizimos = receitas
      .filter((receita) => normalizeText(receita.categoria) === "dizimo")
      .reduce((sum, receita) => sum + receita.valor, 0)

    return {
      totalReceitas,
      totalDespesas,
      totalDizimos,
      saldoLiquido: totalReceitas - totalDespesas,
    }
  }, [receitas, despesas])

  const chartData = useMemo(() => {
    const groupedData: { [key: string]: { receitas: number; despesas: number } } = {}

    const getKey = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")

      switch (periodo) {
        case "daily":
          return `${year}-${month}-${day}`
        case "weekly":
          return getWeekKey(date)
        case "yearly":
          return `${year}`
        case "monthly":
        default:
          return `${year}-${month}`
      }
    }

    const processItem = (item: { data: string; valor: number }, type: "receitas" | "despesas") => {
      const date = parseLocalDateString(item.data)
      const key = getKey(date)
      if (!groupedData[key]) {
        groupedData[key] = { receitas: 0, despesas: 0 }
      }
      groupedData[key][type] += item.valor
    }

    receitas.forEach((r) => processItem(r, "receitas"))
    despesas.forEach((d) => processItem(d, "despesas"))

    return Object.entries(groupedData)
      .map(([key, values]) => {
        let label = key
        if (periodo === "monthly") {
          label = parseLocalDateString(`${key}-01`).toLocaleDateString("pt-BR", {
            month: "short",
            year: "2-digit",
          })
        } else if (periodo === "weekly") {
          const [year, week] = key.split("-W")
          label = `Sem ${week}/${year}`
        } else if (periodo === "daily") {
          label = parseLocalDateString(key).toLocaleDateString("pt-BR")
        }

        return {
          key,
          label,
          receitas: values.receitas,
          despesas: values.despesas,
          saldo: values.receitas - values.despesas,
        }
      })
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12)
  }, [receitas, despesas, periodo])

  const recentTransactions = useMemo(() => {
    const allTransactions = [
      ...receitas.map((r) => ({ ...r, type: "receita" as const })),
      ...despesas.map((d) => ({ ...d, type: "despesa" as const })),
    ]

    return allTransactions
      .sort((a, b) => parseLocalDateString(b.data).getTime() - parseLocalDateString(a.data).getTime())
      .slice(0, 6)
  }, [receitas, despesas])

  const transactionTableData = useMemo(
    () =>
      recentTransactions.map((item, index) => ({
        key: item.id ?? `${item.type}-${index}`,
        tipo: item.type,
        descricao: item.descricao,
        categoria: item.categoria,
        data: item.data,
        valor: item.valor,
      })),
    [recentTransactions],
  )

  const transactionColumns: TableProps<typeof transactionTableData[number]>["columns"] = [
    {
      title: "Tipo",
      dataIndex: "tipo",
      key: "tipo",
      render: (value: string) => (
        <Tag color={value === "receita" ? "green" : "red"}>
          {value === "receita" ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {value === "receita" ? "Receita" : "Despesa"}
        </Tag>
      ),
    },
    {
      title: "Descricao",
      dataIndex: "descricao",
      key: "descricao",
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: "Categoria",
      dataIndex: "categoria",
      key: "categoria",
      render: (value: string) => <Typography.Text type="secondary">{value}</Typography.Text>,
    },
    {
      title: "Data",
      dataIndex: "data",
      key: "data",
      render: (value: string) => parseLocalDateString(value).toLocaleDateString("pt-BR"),
    },
    {
      title: "Valor",
      dataIndex: "valor",
      key: "valor",
      align: "right",
      render: (value: number, record: { tipo: string }) => (
        <Typography.Text type={record.tipo === "receita" ? "success" : "danger"}>
          {hidden ? "******" : `${record.tipo === "receita" ? "+" : "-"}${formatCurrency(value)}`}
        </Typography.Text>
      ),
    },
  ]

  const axisLabelColor = isDark ? "#E2E8F0" : "#475569"
  const gridLineColor = isDark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.08)"
  const tooltipBackground = isDark ? "rgba(15, 23, 42, 0.92)" : "#ffffff"
  const tooltipBorder = isDark ? "#334155" : "#E2E8F0"
  const tooltipTextColor = isDark ? "#F8FAFC" : "#0F172A"

  const overviewOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          crossStyle: {
            color: "#94a3b8",
          },
        },
        valueFormatter: (value: number) => formatCurrency(value),
        backgroundColor: tooltipBackground,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipTextColor },
      },
      toolbox: {
        top: 8,
        right: 12,
        itemSize: 14,
        itemGap: 12,
        feature: {
          dataView: { show: true, readOnly: false },
          magicType: { show: true, type: ["line", "bar"] },
          restore: { show: true },
          saveAsImage: { show: true },
        },
        iconStyle: {
          borderColor: axisLabelColor,
        },
      },
      legend: {
        bottom: 0,
        left: "center",
        data: ["Receitas", "Despesas", "Saldo"],
        textStyle: { color: axisLabelColor },
      },
      grid: { left: 24, right: 40, top: 64, bottom: 64, containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: true,
        data: chartData.map((item) => item.label),
        axisLabel: { color: axisLabelColor, fontSize: 11, margin: 12 },
        axisLine: { lineStyle: { color: gridLineColor } },
        axisTick: { show: false },
        axisPointer: {
          type: "shadow",
        },
      },
      yAxis: [
        {
          type: "value",
          name: "Receitas/Despesas",
          nameLocation: "end",
          nameRotate: 0,
          nameGap: 20,
          nameTextStyle: { color: axisLabelColor, fontSize: 12 },
          axisLabel: { color: axisLabelColor, formatter: (value: number) => formatCompactCurrency(value) },
          splitLine: { lineStyle: { color: gridLineColor } },
        },
        {
          type: "value",
          name: "Saldo",
          nameLocation: "end",
          nameRotate: 0,
          nameGap: 20,
          nameTextStyle: { color: axisLabelColor, fontSize: 12 },
          axisLabel: { color: axisLabelColor, formatter: (value: number) => formatCompactCurrency(value) },
          splitLine: { show: false },
        },
      ],
      dataZoom: [],
      series: [
        {
          name: "Receitas",
          type: "bar",
          data: chartData.map((item) => item.receitas),
          barWidth: 16,
          barGap: "30%",
          itemStyle: {
            color: "#3b82f6",
            borderRadius: [6, 6, 0, 0],
          },
          tooltip: {
            valueFormatter: (value: number) => formatCurrency(Number(value)),
          },
          emphasis: { focus: "series" },
        },
        {
          name: "Despesas",
          type: "bar",
          data: chartData.map((item) => item.despesas),
          barWidth: 16,
          barGap: "30%",
          itemStyle: {
            color: "#22c55e",
            borderRadius: [6, 6, 0, 0],
          },
          tooltip: {
            valueFormatter: (value: number) => formatCurrency(Number(value)),
          },
          emphasis: { focus: "series" },
        },
        {
          name: "Saldo",
          type: "line",
          smooth: true,
          yAxisIndex: 1,
          data: chartData.map((item) => item.saldo),
          lineStyle: { width: 2.5, color: "#64748b" },
          symbol: "circle",
          symbolSize: 6,
          tooltip: {
            valueFormatter: (value: number) => formatCurrency(Number(value)),
          },
          emphasis: { focus: "series" },
        },
      ],
    }),
    [
      axisLabelColor,
      chartData,
      gridLineColor,
      tooltipBackground,
      tooltipBorder,
      tooltipTextColor,
    ],
  )

  const maskedValue = (value: number) => (hidden ? "******" : formatCurrency(value))

  if (loadingReceitas || loadingDespesas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ConfigProvider theme={getAntdTheme(isDark)}>
      <div className="space-y-6 p-6">
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={0}>
              <Typography.Title level={3} className="m-0">
                Dashboard financeiro
              </Typography.Title>
              <Typography.Text type="secondary">
                Visao executiva do fluxo de caixa e entradas principais.
              </Typography.Text>
            </Space>
          </Col>
          <Col xs={24} md={12} className="flex md:justify-end">
            <Space>
              <Tag color={stats.saldoLiquido >= 0 ? "green" : "red"}>
                {stats.saldoLiquido >= 0 ? "Superavit" : "Deficit"}: {maskedValue(stats.saldoLiquido)}
              </Tag>
              <Switch
                checked={hidden}
                onChange={setHidden}
                checkedChildren={<EyeInvisibleOutlined />}
                unCheckedChildren={<EyeOutlined />}
              />
              <Typography.Text type="secondary">Ocultar valores</Typography.Text>
            </Space>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Receitas"
                value={hidden ? 0 : stats.totalReceitas}
                formatter={(value) => (hidden ? "******" : formatCurrency(Number(value)))}
                valueStyle={{ color: "#16a34a" }}
                prefix={<RiseOutlined />}
              />
              <Typography.Text type="secondary">{receitas.length} transacoes</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Despesas"
                value={hidden ? 0 : stats.totalDespesas}
                formatter={(value) => (hidden ? "******" : formatCurrency(Number(value)))}
                valueStyle={{ color: "#ef4444" }}
                prefix={<FallOutlined />}
              />
              <Typography.Text type="secondary">{despesas.length} transacoes</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Dizimos"
                value={hidden ? 0 : stats.totalDizimos}
                formatter={(value) => (hidden ? "******" : formatCurrency(Number(value)))}
                valueStyle={{ color: "#2563eb" }}
                prefix={<RiseOutlined />}
              />
              <Typography.Text type="secondary">
                {receitas.filter((r) => normalizeText(r.categoria) === "dizimo").length} registros
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Saldo liquido"
                value={hidden ? 0 : stats.saldoLiquido}
                formatter={(value) => (hidden ? "******" : formatCurrency(Number(value)))}
                valueStyle={{ color: stats.saldoLiquido >= 0 ? "#16a34a" : "#f97316" }}
              />
              <Typography.Text type="secondary">Receitas - Despesas</Typography.Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              title={<Typography.Text strong>Visao geral</Typography.Text>}
              extra={
                <Space size="middle" wrap>
                  <Segmented
                    size="small"
                    options={PERIOD_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
                    value={periodo}
                    onChange={(value) => setPeriodo(value as PeriodValue)}
                  />
                  <Typography.Text type="secondary">Ultimos 12 registros</Typography.Text>
                </Space>
              }
            >
              {chartData.length ? (
                <ReactECharts option={overviewOption} style={{ height: 360 }} />
              ) : (
                <Empty description="Sem dados para o periodo selecionado" />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Transacoes recentes">
              {transactionTableData.length ? (
                <Table
                  columns={transactionColumns}
                  dataSource={transactionTableData}
                  pagination={{ pageSize: 6, size: "small" }}
                  size="small"
                />
              ) : (
                <div className="py-8">
                  <Empty description="Nenhuma transacao encontrada" />
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  )
}
