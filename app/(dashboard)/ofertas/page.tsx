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

const defaultOfferingTypes = [
  "Oferta Culto Domingo",
  "Oferta Culto Quinta",
  "Oferta de Primicias",
  "Oferta Missionaria",
  "Oferta Especial",
  "Dizimo",
  "Outros",
]

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

const parseOfertaDescricao = (descricao: string, tipos: string[]) => {
  const normalized = normalizeText(descricao)

  for (const tipo of tipos) {
    const normalizedTipo = normalizeText(tipo)
    if (normalized.startsWith(`${normalizedTipo} - `)) {
      const separatorIndex = descricao.indexOf(" - ")
      return {
        tipo,
        descricao: separatorIndex >= 0 ? descricao.slice(separatorIndex + 3) : descricao,
      }
    }
  }

  return { tipo: "", descricao }
}

export default function OfertasPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [notificationApi, notificationContextHolder] = notification.useNotification()

  const [ofertaModalOpen, setOfertaModalOpen] = useState(false)
  const [offeringTypeModalOpen, setOfferingTypeModalOpen] = useState(false)
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingOfferingType, setEditingOfferingType] = useState<CategoryItem | null>(null)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<CategoryItem | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")

  const [ofertaForm] = Form.useForm()
  const [offeringTypeForm] = Form.useForm()
  const [paymentMethodForm] = Form.useForm()

  const { receitas, loading, addReceita, updateReceita, deleteReceita } = useReceitas()
  const {
    categories: offeringTypes,
    loading: offeringTypesLoading,
    addCategory: addOfferingType,
    updateCategory: updateOfferingType,
    deleteCategory: deleteOfferingType,
  } = useCategories("ofertaTypes")

  const {
    categories: customPaymentMethods,
    loading: customPaymentMethodsLoading,
    addCategory: addCustomPaymentMethod,
    updateCategory: updateCustomPaymentMethod,
    deleteCategory: deleteCustomPaymentMethod,
  } = useCategories("paymentMethods")

  const allOfferingTypes = useMemo(() => {
    const names = [...defaultOfferingTypes, ...offeringTypes.map((type) => type.name)]
    return Array.from(new Set(names))
  }, [offeringTypes])

  const allPaymentMethods = useMemo(() => {
    const customMapped = customPaymentMethods.map((method) => ({
      value: method.name.toLowerCase().replace(/\s/g, "-"),
      label: method.name,
      icon: WalletOutlined,
    }))

    return [
      ...defaultPaymentMethods.filter(
        (method) => !customMapped.some((custom) => custom.value === method.value),
      ),
      ...customMapped,
    ]
  }, [customPaymentMethods])

  const ofertas = useMemo(() => {
    return receitas.filter((receita) => normalizeText(receita.categoria) === "oferta")
  }, [receitas])

  const filteredOfertas = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm)

    return ofertas.filter((oferta) => {
      const matchesSearch = normalizeText(oferta.descricao).includes(normalizedSearch)
      const normalizedTipoFilter = normalizeText(tipoFilter)
      const matchesTipo =
        tipoFilter === "all" ||
        normalizeText(oferta.descricao).startsWith(`${normalizedTipoFilter} -`) ||
        normalizeText(oferta.descricao) === normalizedTipoFilter
      const matchesPayment =
        paymentFilter === "all" || (oferta.formaPagamento || "pix") === paymentFilter

      return matchesSearch && matchesTipo && matchesPayment
    })
  }, [ofertas, searchTerm, tipoFilter, paymentFilter])

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const totalGeral = ofertas.reduce((sum, oferta) => sum + oferta.valor, 0)
    const totalMesAtual = ofertas
      .filter((oferta) => {
        const date = new Date(oferta.data)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      .reduce((sum, oferta) => sum + oferta.valor, 0)

    const maiorOferta = ofertas.length > 0 ? Math.max(...ofertas.map((oferta) => oferta.valor)) : 0
    const mediaOferta = ofertas.length > 0 ? totalGeral / ofertas.length : 0

    const porFormaPagamento = ofertas.reduce(
      (acc, oferta) => {
        const forma = oferta.formaPagamento || "pix"
        acc[forma] = (acc[forma] || 0) + oferta.valor
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalGeral,
      totalMesAtual,
      totalOfertas: ofertas.length,
      maiorOferta,
      mediaOferta,
      porFormaPagamento,
    }
  }, [ofertas])

  const getPaymentInfo = (formaPagamento?: string) => {
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
    ofertaForm.setFieldsValue({
      tipo: undefined,
      descricao: "",
      valor: undefined,
      data: dayjs(getTodayDateString()),
      formaPagamento: "pix",
      observacoes: "",
    })
    setOfertaModalOpen(true)
  }

  const handleEdit = (oferta: Receita) => {
    const parsed = parseOfertaDescricao(oferta.descricao, allOfferingTypes)

    setEditingId(oferta.id)
    ofertaForm.setFieldsValue({
      tipo: parsed.tipo || undefined,
      descricao: parsed.descricao,
      valor: oferta.valor,
      data: dayjs(oferta.data),
      formaPagamento: oferta.formaPagamento || "pix",
      observacoes: oferta.observacoes || "",
    })
    setOfertaModalOpen(true)
  }

  const handleOfertaSubmit = async () => {
    try {
      const values = await ofertaForm.validateFields()
      const descricao = values.tipo ? `${values.tipo} - ${values.descricao}` : values.descricao

      const ofertaData = {
        descricao,
        categoria: "oferta",
        valor: Number(values.valor),
        data: values.data.format("YYYY-MM-DD"),
        formaPagamento: values.formaPagamento,
        observacoes: values.observacoes || "",
      }

      if (editingId) {
        await updateReceita(editingId, ofertaData)
        notificationApi.success({ message: "Oferta atualizada com sucesso." })
      } else {
        //@ts-ignore
        await addReceita(ofertaData)
        notificationApi.success({ message: "Oferta registrada com sucesso." })
      }

      setOfertaModalOpen(false)
      setEditingId(null)
      ofertaForm.resetFields()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      notificationApi.error({ message: "Erro ao salvar oferta." })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteReceita(id)
      notificationApi.success({ message: "Oferta excluida com sucesso." })
    } catch (error) {
      notificationApi.error({ message: "Erro ao excluir oferta." })
    }
  }

  const handleOfferingTypeSubmit = async () => {
    try {
      const values = await offeringTypeForm.validateFields()
      const name = values.name.trim()

      if (editingOfferingType) {
        await updateOfferingType(editingOfferingType.id, name)
        notificationApi.success({ message: "Tipo de oferta atualizado com sucesso." })
      } else {
        await addOfferingType(name)
        notificationApi.success({ message: "Tipo de oferta adicionado com sucesso." })
      }

      setEditingOfferingType(null)
      offeringTypeForm.resetFields()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      notificationApi.error({ message: "Erro ao salvar tipo de oferta." })
    }
  }

  const handleEditOfferingType = (type: CategoryItem) => {
    setEditingOfferingType(type)
    offeringTypeForm.setFieldsValue({ name: type.name })
  }

  const handleDeleteOfferingType = async (id: string) => {
    try {
      await deleteOfferingType(id)
      notificationApi.success({ message: "Tipo de oferta excluido com sucesso." })
    } catch (error) {
      notificationApi.error({ message: "Erro ao excluir tipo de oferta." })
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

  const closeOfferingTypeModal = () => {
    setOfferingTypeModalOpen(false)
    setEditingOfferingType(null)
    offeringTypeForm.resetFields()
  }

  const closePaymentMethodModal = () => {
    setPaymentMethodModalOpen(false)
    setEditingPaymentMethod(null)
    paymentMethodForm.resetFields()
  }

  const closeOfertaModal = () => {
    setOfertaModalOpen(false)
    setEditingId(null)
    ofertaForm.resetFields()
  }

  const columns: TableProps<Receita>["columns"] = [
    {
      title: "Descricao",
      dataIndex: "descricao",
      key: "descricao",
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
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
          //@ts-ignore
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
            title="Excluir oferta?"
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

  const isLoading = loading || offeringTypesLoading || customPaymentMethodsLoading

  return (
    <ConfigProvider theme={getAntdTheme(isDark)}>
      {notificationContextHolder}
      <Spin spinning={isLoading} size="large">
        <div className="space-y-6 min-h-[400px]">
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm dark:border-slate-700/70 dark:from-slate-900/70 dark:via-slate-900 dark:to-slate-800/70">
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={16}>
                <Space direction="vertical" size="small">
                  <Typography.Title level={3} className="m-0">
                    Ofertas
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    Controle completo das ofertas com formas de pagamento.
                  </Typography.Text>
                </Space>
              </Col>
              <Col xs={24} lg={20} className="flex lg:justify-end">
                <Space>
                  <Button icon={<SettingOutlined />} onClick={() => setOfferingTypeModalOpen(true)}>
                    Tipos de oferta
                  </Button>
                  <Button icon={<SettingOutlined />} onClick={() => setPaymentMethodModalOpen(true)}>
                    Formas de pagamento
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    Registrar oferta
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
              <Typography.Text type="secondary">{stats.totalOfertas} ofertas registradas</Typography.Text>
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
              <Statistic
                title="Maior oferta"
                value={stats.maiorOferta}
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">Maior valor registrado</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Media"
                value={stats.mediaOferta}
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">Valor medio por oferta</Typography.Text>
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

        <Card title="Historico de ofertas" extra={<Tag color="blue">Total filtrado: {filteredOfertas.length}</Tag>}>
          <Space className="w-full" size="middle" wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Buscar ofertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-[220px]"
            />
            <Select
              value={tipoFilter}
              onChange={setTipoFilter}
              className="min-w-[220px]"
              options={[
                { label: "Todos os tipos", value: "all" },
                ...allOfferingTypes.map((tipo) => ({ label: tipo, value: tipo })),
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
            {filteredOfertas.length === 0 ? (
              <div className="py-10">
                <Empty
                  description={ofertas.length === 0 ? "Nenhuma oferta registrada" : "Nenhuma oferta encontrada"}
                />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={filteredOfertas}
                rowKey="id"
                pagination={{ pageSize: 10, size: "small" }}
              />
            )}
          </div>
        </Card>
        </div>
      </Spin>

      <Modal
        open={ofertaModalOpen}
        onCancel={closeOfertaModal}
        onOk={() => ofertaForm.submit()}
        okText={editingId ? "Atualizar" : "Salvar"}
        title={editingId ? "Editar oferta" : "Registrar oferta"}
      >
        <Form
          form={ofertaForm}
          layout="vertical"
          onFinish={handleOfertaSubmit}
          initialValues={{ data: dayjs(getTodayDateString()), formaPagamento: "pix" }}
        >
          <Form.Item label="Tipo" name="tipo">
            <Select
              options={allOfferingTypes.map((tipo) => ({ label: tipo, value: tipo }))}
              placeholder="Selecione o tipo"
              allowClear
            />
          </Form.Item>
          <Form.Item
            label="Descricao"
            name="descricao"
            rules={[{ required: true, message: "Informe a descricao" }]}
          >
            <Input placeholder="Descricao da oferta" />
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
        open={offeringTypeModalOpen}
        onCancel={closeOfferingTypeModal}
        onOk={() => offeringTypeForm.submit()}
        okText={editingOfferingType ? "Atualizar" : "Adicionar"}
        title="Tipos de oferta"
      >
        <Form form={offeringTypeForm} layout="vertical" onFinish={handleOfferingTypeSubmit}>
          <Form.Item
            label="Nome do tipo"
            name="name"
            rules={[{ required: true, message: "Informe o nome do tipo" }]}
          >
            <Input placeholder="Ex: Campanha especial" />
          </Form.Item>
        </Form>
        <div className="mt-2">
          <Typography.Text strong>Tipos existentes</Typography.Text>
          <List
            className="mt-2"
            dataSource={offeringTypes}
            locale={{ emptyText: "Nenhum tipo personalizado." }}
            renderItem={(type) => (
              <List.Item
                actions={[
                  <Button type="text" icon={<EditOutlined />} onClick={() => handleEditOfferingType(type)} />,
                  <Popconfirm
                    title="Excluir tipo de oferta?"
                    okText="Excluir"
                    cancelText="Cancelar"
                    onConfirm={() => handleDeleteOfferingType(type.id)}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <Typography.Text>{type.name}</Typography.Text>
              </List.Item>
            )}
          />
        </div>
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
