"use client"

import { useMemo, useState } from "react"
import type { ComponentType } from "react"
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  notification,
} from "antd"
import type { TableProps } from "antd"
import {
  BankOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  PlusOutlined,
  QrcodeOutlined,
  SearchOutlined,
  SettingOutlined,
  WalletOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import { useTheme } from "next-themes"

import { useReceitas } from "@/src/core/hooks/use-receitas"
import { useCategories } from "@/src/core/hooks/use-categories"
import type { Receita } from "@/src/core/@types/Receita"
import { getAntdTheme } from "@/components/antd-theme"

const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseLocalDateString = (value: string) =>
  new Date(value.includes("T") ? value : `${value}T00:00:00`)

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

type CategoryItem = { id: string; name: string }

type PaymentMethodOption = {
  value: string
  label: string
  color?: string
  icon: ComponentType<any>
}

const defaultPaymentMethods: PaymentMethodOption[] = [
  {
    value: "pix",
    label: "PIX",
    icon: QrcodeOutlined,
    color: "green",
  },
  {
    value: "cartao-debito",
    label: "Cartao debito",
    icon: CreditCardOutlined,
    color: "blue",
  },
  {
    value: "cartao-credito",
    label: "Cartao credito",
    icon: CreditCardOutlined,
    color: "purple",
  },
  {
    value: "dinheiro",
    label: "Dinheiro",
    icon: DollarOutlined,
    color: "gold",
  },
  {
    value: "transferencia",
    label: "Transferencia",
    icon: BankOutlined,
    color: "cyan",
  },
]

const extractMemberName = (dizimo: Receita) => {
  if (dizimo.membro) {
    return dizimo.membro
  }

  const description = dizimo.descricao || ""
  const normalized = normalizeText(description)

  if (normalized.startsWith("dizimo - ")) {
    const separatorIndex = description.indexOf(" - ")
    if (separatorIndex >= 0) {
      return description.slice(separatorIndex + 3).split(" (")[0]
    }
  }

  return description.split(" (")[0]
}

export default function DizimosPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [notificationApi, notificationContextHolder] = notification.useNotification()

  const [dizimoModalOpen, setDizimoModalOpen] = useState(false)
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<CategoryItem | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [monthFilter, setMonthFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")

  const [dizimoForm] = Form.useForm()
  const [paymentMethodForm] = Form.useForm()

  const { receitas, loading, addReceita, updateReceita, deleteReceita } = useReceitas()
  const {
    categories: customPaymentMethods,
    loading: customPaymentMethodsLoading,
    addCategory: addCustomPaymentMethod,
    updateCategory: updateCustomPaymentMethod,
    deleteCategory: deleteCustomPaymentMethod,
  } = useCategories("paymentMethods")

  const allPaymentMethods = useMemo<PaymentMethodOption[]>(() => {
    const customMapped: PaymentMethodOption[] = customPaymentMethods.map((method) => ({
      value: method.name.toLowerCase().replace(/\s/g, "-"),
      label: method.name,
      icon: WalletOutlined,
      color: "geekblue",
    }))

    return [
      ...defaultPaymentMethods.filter(
        (method) => !customMapped.some((custom) => custom.value === method.value),
      ),
      ...customMapped,
    ]
  }, [customPaymentMethods])

  const dizimos = useMemo(() => {
    return receitas.filter((receita) => normalizeText(receita.categoria) === "dizimo")
  }, [receitas])

  const filteredDizimos = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm)

    return dizimos.filter((dizimo) => {
      const memberName = extractMemberName(dizimo)
      const matchesSearch =
        normalizeText(dizimo.descricao).includes(normalizedSearch) ||
        normalizeText(memberName).includes(normalizedSearch)
      const matchesMonth =
        monthFilter === "all" || new Date(dizimo.data).getMonth() === Number(monthFilter)
      const matchesPayment =
        paymentFilter === "all" || (dizimo.formaPagamento || "pix") === paymentFilter

      return matchesSearch && matchesMonth && matchesPayment
    })
  }, [dizimos, searchTerm, monthFilter, paymentFilter])

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const totalGeral = dizimos.reduce((sum, dizimo) => sum + dizimo.valor, 0)
    const totalMesAtual = dizimos
      .filter((dizimo) => {
        const date = new Date(dizimo.data)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      .reduce((sum, dizimo) => sum + dizimo.valor, 0)

    const membrosContribuintes = new Set(dizimos.map((dizimo) => extractMemberName(dizimo))).size

    const porFormaPagamento = dizimos.reduce(
      (acc, dizimo) => {
        const forma = dizimo.formaPagamento || "pix"
        acc[forma] = (acc[forma] || 0) + dizimo.valor
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalGeral,
      totalMesAtual,
      totalDizimos: dizimos.length,
      membrosContribuintes,
      porFormaPagamento,
    }
  }, [dizimos])

  const getPaymentInfo = (formaPagamento?: string): PaymentMethodOption => {
    const value = formaPagamento || "pix"
    return (
      allPaymentMethods.find((method) => method.value === value) || {
        value,
        label: value,
        icon: WalletOutlined,
      }
    )
  }

  const openCreateModal = () => {
    setEditingId(null)
    dizimoForm.setFieldsValue({
      membro: "",
      valor: undefined,
      data: dayjs(getTodayDateString()),
      formaPagamento: "pix",
      observacoes: "",
    })
    setDizimoModalOpen(true)
  }

  const handleEdit = (dizimo: Receita) => {
    setEditingId(dizimo.id)
    dizimoForm.setFieldsValue({
      membro: extractMemberName(dizimo),
      valor: dizimo.valor,
      data: dayjs(dizimo.data),
      formaPagamento: dizimo.formaPagamento || "pix",
      observacoes: dizimo.observacoes || "",
    })
    setDizimoModalOpen(true)
  }

  const handleDizimoSubmit = async () => {
    try {
      const values = await dizimoForm.validateFields()
      const descricao = values.observacoes
        ? `Dizimo - ${values.membro} (${values.observacoes})`
        : `Dizimo - ${values.membro}`

      const dizimoData = {
        tipo: "receita",
        descricao,
        categoria: "dizimo",
        valor: Number(values.valor),
        data: values.data.format("YYYY-MM-DD"),
        formaPagamento: values.formaPagamento,
        membro: values.membro,
        observacoes: values.observacoes || "",
      }

      if (editingId) {
        await updateReceita(editingId, dizimoData)
        notificationApi.success({ message: "Dizimo atualizado com sucesso." })
      } else {
        await addReceita(dizimoData)
        notificationApi.success({ message: "Dizimo registrado com sucesso." })
      }

      setDizimoModalOpen(false)
      setEditingId(null)
      dizimoForm.resetFields()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      notificationApi.error({ message: "Erro ao salvar dizimo." })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteReceita(id)
      notificationApi.success({ message: "Dizimo excluido com sucesso." })
    } catch (error) {
      notificationApi.error({ message: "Erro ao excluir dizimo." })
    }
  }

  const handlePaymentMethodSubmit = async () => {
    try {
      const values = await paymentMethodForm.validateFields()
      const name = values.name.trim()

      if (editingPaymentMethod) {
        await updateCustomPaymentMethod(editingPaymentMethod.id, name)
        notificationApi.success({ message: "Forma de pagamento atualizada com sucesso." })
      } else {
        await addCustomPaymentMethod(name)
        notificationApi.success({ message: "Forma de pagamento adicionada com sucesso." })
      }

      setEditingPaymentMethod(null)
      paymentMethodForm.resetFields()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      notificationApi.error({ message: "Erro ao salvar forma de pagamento." })
    }
  }

  const handleEditPaymentMethod = (method: CategoryItem) => {
    setEditingPaymentMethod(method)
    paymentMethodForm.setFieldsValue({ name: method.name })
  }

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await deleteCustomPaymentMethod(id)
      notificationApi.success({ message: "Forma de pagamento excluida com sucesso." })
    } catch (error) {
      notificationApi.error({ message: "Erro ao excluir forma de pagamento." })
    }
  }

  const closePaymentMethodModal = () => {
    setPaymentMethodModalOpen(false)
    setEditingPaymentMethod(null)
    paymentMethodForm.resetFields()
  }

  const closeDizimoModal = () => {
    setDizimoModalOpen(false)
    setEditingId(null)
    dizimoForm.resetFields()
  }

  const columns: TableProps<Receita>["columns"] = [
    {
      title: "Membro",
      key: "membro",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{extractMemberName(record)}</Typography.Text>
          {record.observacoes ? (
            <Typography.Text type="secondary">{record.observacoes}</Typography.Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: "Data",
      dataIndex: "data",
      key: "data",
      render: (value: string) => parseLocalDateString(value).toLocaleDateString("pt-BR"),
    },
    {
      title: "Forma de pagamento",
      dataIndex: "formaPagamento",
      key: "formaPagamento",
      render: (value: string) => {
        const paymentInfo = getPaymentInfo(value)
        const IconComponent = paymentInfo.icon
        return (
          <Tag color={paymentInfo.color}>
            <IconComponent style={{ marginRight: 6 }} />
            {paymentInfo.label}
          </Tag>
        )
      },
    },
    {
      title: "Valor",
      dataIndex: "valor",
      key: "valor",
      align: "right",
      render: (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    },
    {
      title: "Acoes",
      key: "acoes",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Excluir dizimo?"
            okText="Excluir"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const isLoading = loading || customPaymentMethodsLoading

  return (
    <ConfigProvider theme={getAntdTheme(isDark)}>
      {notificationContextHolder}
      <Spin spinning={isLoading} size="large">
        <div className="space-y-6 min-h-[400px]">
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm dark:border-slate-700/70 dark:from-slate-900/70 dark:via-slate-900 dark:to-slate-800/70">
            <Row gutter={[16, 16]} align="top" justify="space-between">
              <Col xs={24} lg={16}>
                <Space direction="vertical" size="small">
                  <Typography.Title level={3} className="m-0">
                    Dizimos
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    Controle completo dos dizimos com formas de pagamento.
                  </Typography.Text>
                </Space>
              </Col>
              <Col xs={24} lg={20} className="flex lg:justify-center lg:pr-4">
                <Space>
                  <Button icon={<SettingOutlined />} onClick={() => setPaymentMethodModalOpen(true)}>
                    Formas de pagamento
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    Registrar dizimo
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total geral"
                value={stats.totalGeral}
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">{stats.totalDizimos} dizimos registrados</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Mes atual"
                value={stats.totalMesAtual}
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">
                {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Contribuintes" value={stats.membrosContribuintes} />
              <Typography.Text type="secondary">Membros unicos</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Media mensal"
                value={
                  stats.totalDizimos > 0
                    ? stats.totalGeral / Math.max(1, stats.totalDizimos / 12)
                    : 0
                }
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">Estimativa baseada no historico</Typography.Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {allPaymentMethods.map((method) => {
            const valor = stats.porFormaPagamento[method.value] || 0
            const percentual = stats.totalGeral > 0 ? (valor / stats.totalGeral) * 100 : 0
            const IconComponent = method.icon

            return (
              <Col xs={24} sm={12} lg={6} key={method.value}>
                <Card>
                  <Space direction="vertical" size={4}>
                    <Space align="center">
                      <IconComponent />
                      <Typography.Text>{method.label}</Typography.Text>
                    </Space>
                    <Typography.Title level={4} className="m-0">
                      R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Typography.Title>
                    <Typography.Text type="secondary">{percentual.toFixed(1)}% do total</Typography.Text>
                  </Space>
                </Card>
              </Col>
            )
          })}
        </Row>

        <Card title="Historico de dizimos" extra={<Tag color="blue">Total filtrado: {filteredDizimos.length}</Tag>}>
          <Space className="w-full" size="middle" wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Buscar por membro ou descricao..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-[220px]"
            />
            <Select
              value={monthFilter}
              onChange={setMonthFilter}
              className="min-w-[200px]"
              options={[
                { label: "Todos os meses", value: "all" },
                { label: "Janeiro", value: "0" },
                { label: "Fevereiro", value: "1" },
                { label: "Marco", value: "2" },
                { label: "Abril", value: "3" },
                { label: "Maio", value: "4" },
                { label: "Junho", value: "5" },
                { label: "Julho", value: "6" },
                { label: "Agosto", value: "7" },
                { label: "Setembro", value: "8" },
                { label: "Outubro", value: "9" },
                { label: "Novembro", value: "10" },
                { label: "Dezembro", value: "11" },
              ]}
            />
            <Select
              value={paymentFilter}
              onChange={setPaymentFilter}
              className="min-w-[220px]"
              options={[
                { label: "Todas as formas", value: "all" },
                ...allPaymentMethods.map((method) => {
                  const IconComponent = method.icon
                  return {
                    label: (
                      <Space>
                        <IconComponent />
                        {method.label}
                      </Space>
                    ),
                    value: method.value,
                  }
                }),
              ]}
            />
          </Space>

          <div className="mt-4">
            {filteredDizimos.length === 0 ? (
              <div className="py-10">
                <Empty
                  description={dizimos.length === 0 ? "Nenhum dizimo registrado" : "Nenhum dizimo encontrado"}
                />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={filteredDizimos}
                rowKey="id"
                pagination={{ pageSize: 10, size: "small" }}
              />
            )}
          </div>
        </Card>
        </div>
      </Spin>

      <Modal
        open={dizimoModalOpen}
        onCancel={closeDizimoModal}
        onOk={() => dizimoForm.submit()}
        okText={editingId ? "Atualizar" : "Salvar"}
        title={editingId ? "Editar dizimo" : "Registrar dizimo"}
      >
        <Form
          form={dizimoForm}
          layout="vertical"
          onFinish={handleDizimoSubmit}
          initialValues={{ data: dayjs(getTodayDateString()), formaPagamento: "pix" }}
        >
          <Form.Item
            label="Membro"
            name="membro"
            rules={[{ required: true, message: "Informe o membro" }]}
          >
            <Input placeholder="Nome do membro" />
          </Form.Item>
          <Form.Item
            label="Valor"
            name="valor"
            rules={[{ required: true, message: "Informe o valor" }]}
          >
            <InputNumber className="w-full" min={0} step={0.01} placeholder="0,00" />
          </Form.Item>
          <Form.Item
            label="Data"
            name="data"
            rules={[{ required: true, message: "Informe a data" }]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item
            label="Forma de pagamento"
            name="formaPagamento"
            rules={[{ required: true, message: "Selecione a forma de pagamento" }]}
          >
            <Select
              options={allPaymentMethods.map((method) => {
                const IconComponent = method.icon
                return {
                  label: (
                    <Space>
                      <IconComponent />
                      {method.label}
                    </Space>
                  ),
                  value: method.value,
                }
              })}
            />
          </Form.Item>
          <Form.Item label="Observacoes" name="observacoes">
            <Input.TextArea rows={3} placeholder="Observacoes adicionais" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={paymentMethodModalOpen}
        onCancel={closePaymentMethodModal}
        onOk={() => paymentMethodForm.submit()}
        okText={editingPaymentMethod ? "Atualizar" : "Adicionar"}
        title="Formas de pagamento"
      >
        <Form form={paymentMethodForm} layout="vertical" onFinish={handlePaymentMethodSubmit}>
          <Form.Item
            label="Nome da forma"
            name="name"
            rules={[{ required: true, message: "Informe o nome da forma" }]}
          >
            <Input placeholder="Ex: Boleto, Cheque" />
          </Form.Item>
        </Form>
        <div className="mt-2">
          <Typography.Text strong>Formas existentes</Typography.Text>
          <List
            className="mt-2"
            dataSource={customPaymentMethods}
            locale={{ emptyText: "Nenhuma forma personalizada." }}
            renderItem={(method) => (
              <List.Item
                actions={[
                  <Button type="text" icon={<EditOutlined />} onClick={() => handleEditPaymentMethod(method)} />,
                  <Popconfirm
                    title="Excluir forma de pagamento?"
                    okText="Excluir"
                    cancelText="Cancelar"
                    onConfirm={() => handleDeletePaymentMethod(method.id)}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <Typography.Text>{method.name}</Typography.Text>
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </ConfigProvider>
  )
}
