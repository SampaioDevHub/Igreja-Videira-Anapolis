"use client"

import { useMemo, useState } from "react"
import {
  Avatar,
  Button,
  Card,
  Col,
  ConfigProvider,
  Input,
  List,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  notification,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  MessageOutlined,
  NotificationOutlined,
  SearchOutlined,
  StarOutlined,
  TeamOutlined,
} from "@ant-design/icons"
import { useTheme } from "next-themes"

import { getAntdTheme } from "@/components/antd-theme"
import { useAniversariantes } from "@/src/core/hooks/use-aniversariantes"

type Aniversariante = {
  id: string
  nome: string
  email?: string
  telefone?: string
  dataNascimento: string
  idade: number
  diasRestantes: number
  parabenizado?: boolean
}

const periodoOptions = [
  { label: "Hoje", value: "hoje" },
  { label: "Amanhã", value: "amanha" },
  { label: "Próximos 7 dias", value: "proximos7dias" },
  { label: "Próximos 30 dias", value: "proximos30dias" },
  { label: "Mês", value: "mes" },
]

export default function AniversariantesPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [notificationApi, notificationContextHolder] = notification.useNotification()

  const [searchTerm, setSearchTerm] = useState("")
  const [periodoFilter, setPeriodoFilter] = useState("proximos7dias")

  const {
    aniversariantesProximos,
    aniversariantesHoje,
    aniversariantesAmanha,
    aniversariantesMes,
    loading,
    enviarParabens,
    marcarComoParabenizado,
  } = useAniversariantes()

  const handleEnviarParabens = async (membroId: string, nome: string) => {
    try {
      await enviarParabens(membroId)
      await marcarComoParabenizado(membroId)

      notificationApi.success({
        message: "Parabéns enviados",
        description: `Mensagem de aniversário enviada para ${nome}.`,
        placement: "topRight",
      })
    } catch (error) {
      notificationApi.error({
        message: "Erro ao enviar",
        description: "Não foi possível enviar os parabéns agora.",
        placement: "topRight",
      })
    }
  }

  const getAniversariantesPorPeriodo = () => {
    switch (periodoFilter) {
      case "hoje":
        return aniversariantesHoje
      case "amanha":
        return aniversariantesAmanha
      case "proximos7dias":
        return aniversariantesProximos.filter((a) => a.diasRestantes <= 7)
      case "proximos30dias":
        return aniversariantesProximos.filter((a) => a.diasRestantes <= 30)
      case "mes":
        return aniversariantesMes
      default:
        return aniversariantesProximos
    }
  }

  const filteredAniversariantes = useMemo(() => {
    return getAniversariantesPorPeriodo().filter((aniversariante) =>
      aniversariante.nome.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [searchTerm, periodoFilter, aniversariantesProximos, aniversariantesHoje, aniversariantesAmanha, aniversariantesMes])

  const getDiasRestantesTag = (dias: number) => {
    if (dias === 0) return { color: "red", label: "Hoje" }
    if (dias === 1) return { color: "blue", label: "Amanhã" }
    if (dias < 0) return { color: "default", label: `Há ${Math.abs(dias)} dias` }
    if (dias <= 7) return { color: "gold", label: `Em ${dias} dias` }
    return { color: "default", label: `Em ${dias} dias` }
  }

  const getStatusTag = (aniversariante: Aniversariante) => {
    if (aniversariante.parabenizado) {
      return (
        <Tag color="green" icon={<HeartOutlined />}>
          Parabenizado
        </Tag>
      )
    }

    if (aniversariante.diasRestantes === 0) {
      return (
        <Tag color="red" icon={<ClockCircleOutlined />}>
          Pendente
        </Tag>
      )
    }

    return (
      <Tag color="blue" icon={<CheckCircleOutlined />}>
        Aguardando
      </Tag>
    )
  }

  const columns: ColumnsType<Aniversariante> = [
    {
      title: "Membro",
      dataIndex: "nome",
      key: "nome",
      render: (_: string, record) => (
        <Space>
          <Avatar>{record.nome.charAt(0).toUpperCase()}</Avatar>
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{record.nome}</Typography.Text>
            <Typography.Text type="secondary">{record.email || "Sem email"}</Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Nascimento",
      dataIndex: "dataNascimento",
      key: "dataNascimento",
      render: (value: string) => new Date(value).toLocaleDateString("pt-BR"),
    },
    {
      title: "Idade",
      dataIndex: "idade",
      key: "idade",
      render: (value: number) => (
        <Space>
          <Typography.Text>{value}</Typography.Text>
          {value >= 60 && <StarOutlined className="text-yellow-500" />}
        </Space>
      ),
    },
    {
      title: "Aniversário",
      dataIndex: "diasRestantes",
      key: "diasRestantes",
      render: (value: number) => {
        const info = getDiasRestantesTag(value)
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => getStatusTag(record),
    },
    {
      title: "Ações",
      key: "acoes",
      align: "right",
      render: (_, record) => (
        <Space>
          {record.diasRestantes <= 1 && !record.parabenizado && (
            <Button type="primary" onClick={() => handleEnviarParabens(record.id, record.nome)}>
              Parabenizar
            </Button>
          )}
          {record.telefone && (
            <Button
              icon={<MessageOutlined />}
              href={`https://wa.me/${record.telefone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <ConfigProvider theme={getAntdTheme(isDark)}>
      {notificationContextHolder}
      <Spin spinning={loading} tip="Carregando aniversariantes...">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm dark:border-slate-700/70 dark:from-slate-900/70 dark:via-slate-900 dark:to-slate-800/70">
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={16}>
                <Space direction="vertical" size="small">
                  <Space align="center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-200">
                      <CalendarOutlined className="text-xl" />
                    </div>
                    <div>
                      <Typography.Title level={3} className="m-0">
                        Aniversariantes
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        Controle os aniversários e mantenha o relacionamento em dia.
                      </Typography.Text>
                    </div>
                  </Space>
                  <Space size="small" wrap>
                    <Tag color="red">{aniversariantesHoje.length} hoje</Tag>
                    <Tag color="blue">{aniversariantesAmanha.length} amanhã</Tag>
                    <Tag color="gold">{aniversariantesMes.length} no mês</Tag>
                  </Space>
                </Space>
              </Col>
              <Col xs={24} lg={8} className="flex justify-start lg:justify-end">
                <Button icon={<NotificationOutlined />}>Configurar notificações</Button>
              </Col>
            </Row>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Hoje" value={aniversariantesHoje.length} valueStyle={{ color: "#dc2626" }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Amanhã" value={aniversariantesAmanha.length} valueStyle={{ color: "#2563eb" }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Próximos 7 dias"
                  value={aniversariantesProximos.filter((a) => a.diasRestantes <= 7).length}
                  valueStyle={{ color: "#16a34a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Este mês" value={aniversariantesMes.length} valueStyle={{ color: "#7c3aed" }} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={<Space><TeamOutlined /> Hoje</Space>}
                extra={<Tag color="red">{aniversariantesHoje.length}</Tag>}
              >
                <List
                  dataSource={aniversariantesHoje}
                  locale={{ emptyText: "Nenhum aniversariante hoje" }}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          key="parabenizar"
                          type="primary"
                          disabled={item.parabenizado}
                          onClick={() => handleEnviarParabens(item.id, item.nome)}
                        >
                          {item.parabenizado ? "Enviado" : "Parabenizar"}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar>{item.nome.charAt(0).toUpperCase()}</Avatar>}
                        title={item.nome}
                        description={`${item.idade} anos`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title={<Space><TeamOutlined /> Amanhã</Space>}
                extra={<Tag color="blue">{aniversariantesAmanha.length}</Tag>}
              >
                <List
                  dataSource={aniversariantesAmanha}
                  locale={{ emptyText: "Nenhum aniversariante amanhã" }}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar>{item.nome.charAt(0).toUpperCase()}</Avatar>}
                        title={item.nome}
                        description={`${item.idade} anos`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title={<Space><CalendarOutlined /> Lista de aniversariantes</Space>}
            extra={<Tag color="blue">{filteredAniversariantes.length} registros</Tag>}
          >
            <Row gutter={[16, 16]} align="middle" className="mb-4">
              <Col xs={24} lg={10}>
                <Input
                  allowClear
                  placeholder="Buscar por nome"
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col xs={24} lg={14} className="flex justify-start lg:justify-end">
                <Segmented
                  options={periodoOptions}
                  value={periodoFilter}
                  onChange={(value) => setPeriodoFilter(value as string)}
                />
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={filteredAniversariantes}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: "Nenhum aniversariante encontrado" }}
              scroll={{ x: 900 }}
            />
          </Card>
        </div>
      </Spin>
    </ConfigProvider>
  )
}
