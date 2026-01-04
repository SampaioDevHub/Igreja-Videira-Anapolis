"use client"

import { useMemo, useState } from "react"
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
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import { useTheme } from "next-themes"

import { useDespesas } from "@/src/core/hooks/use-despesas"
import { useCategories } from "@/src/core/hooks/use-categories"
import type { Despesa } from "@/src/core/@types/Despesa"
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

const statusColors: Record<Despesa["status"], string> = {
  Pago: "green",
  Pendente: "gold",
  Vencido: "red",
}

export default function DespesasPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [notificationApi, notificationContextHolder] = notification.useNotification()

  const [despesaModalOpen, setDespesaModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [despesaForm] = Form.useForm()
  const [categoryForm] = Form.useForm()

  const { despesas, loading, addDespesa, updateDespesa, deleteDespesa } = useDespesas()
  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories("despesaCategories")

  const defaultCategories = [
    "Utilidades",
    "Pessoal",
    "Manutencao",
    "Infraestrutura",
    "Ministerios",
    "Agua",
    "Luz",
    "Energia",
    "Combustivel",
    "Outros",
  ]

  const allCategories = useMemo(() => {
    const names = [...defaultCategories, ...categories.map((cat) => cat.name)]
    return Array.from(new Set(names))
  }, [categories])

  const stats = useMemo(() => {
    const total = despesas.reduce((sum, despesa) => sum + despesa.valor, 0)
    const pagas = despesas.filter((d) => d.status === "Pago").reduce((sum, d) => sum + d.valor, 0)
    const pendentes = despesas.filter((d) => d.status === "Pendente").reduce((sum, d) => sum + d.valor, 0)
    const vencidas = despesas.filter((d) => d.status === "Vencido").reduce((sum, d) => sum + d.valor, 0)

    return { total, pagas, pendentes, vencidas }
  }, [despesas])

  const filteredDespesas = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm)

    return despesas.filter((despesa) => {
      const matchesSearch = normalizeText(despesa.descricao).includes(normalizedSearch)
      const matchesCategory =
        categoryFilter === "all" ||
        normalizeText(despesa.categoria) === normalizeText(categoryFilter)
      const matchesStatus =
        statusFilter === "all" || normalizeText(despesa.status) === normalizeText(statusFilter)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [despesas, searchTerm, categoryFilter, statusFilter])

  const openCreateModal = () => {
    setEditingId(null)
    despesaForm.setFieldsValue({
      descricao: "",
      categoria: undefined,
      valor: undefined,
      data: dayjs(getTodayDateString()),
      status: "Pendente",
    })
    setDespesaModalOpen(true)
  }

  const handleEdit = (despesa: Despesa) => {
    setEditingId(despesa.id)
    despesaForm.setFieldsValue({
      descricao: despesa.descricao,
      categoria: despesa.categoria,
      valor: despesa.valor,
      data: dayjs(despesa.data),
      status: despesa.status,
    })
    setDespesaModalOpen(true)
  }

  const handleDespesaSubmit = async () => {
    try {
      const values = await despesaForm.validateFields()
      const despesaData = {
        descricao: values.descricao,
        categoria: values.categoria,
        valor: Number(values.valor),
        data: values.data.format("YYYY-MM-DD"),
        status: values.status,
      }

      if (editingId) {
        await updateDespesa(editingId, despesaData)
        notificationApi.success({ message: "Despesa atualizada com sucesso." })
      } else {
        await addDespesa(despesaData)
        notificationApi.success({ message: "Despesa adicionada com sucesso." })
      }

      setDespesaModalOpen(false)
      setEditingId(null)
      despesaForm.resetFields()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      notificationApi.error({ message: "Erro ao salvar despesa." })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDespesa(id)
      notificationApi.success({ message: "Despesa excluida com sucesso." })
    } catch (error) {
      notificationApi.error({ message: "Erro ao excluir despesa." })
    }
  }

  const handleCategorySubmit = async () => {
    try {
      const values = await categoryForm.validateFields()
      const name = values.name.trim()

      if (editingCategory) {
        await updateCategory(editingCategory.id, name)
        notificationApi.success({ message: "Categoria atualizada com sucesso." })
      } else {
        await addCategory(name)
        notificationApi.success({ message: "Categoria adicionada com sucesso." })
      }

      setEditingCategory(null)
      categoryForm.resetFields()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      notificationApi.error({ message: "Erro ao salvar categoria." })
    }
  }

  const handleEditCategory = (category: CategoryItem) => {
    setEditingCategory(category)
    categoryForm.setFieldsValue({ name: category.name })
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id)
      notificationApi.success({ message: "Categoria excluida com sucesso." })
    } catch (error) {
      notificationApi.error({ message: "Erro ao excluir categoria." })
    }
  }

  const closeCategoryModal = () => {
    setCategoryModalOpen(false)
    setEditingCategory(null)
    categoryForm.resetFields()
  }

  const closeDespesaModal = () => {
    setDespesaModalOpen(false)
    setEditingId(null)
    despesaForm.resetFields()
  }

  const columns: TableProps<Despesa>["columns"] = [
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: Despesa["status"]) => <Tag color={statusColors[value]}>{value}</Tag>,
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
            title="Excluir despesa?"
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

  const isLoading = loading || categoriesLoading

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
                    Despesas
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    Controle completo das despesas registradas.
                  </Typography.Text>
                </Space>
              </Col>
              <Col xs={24} lg={20} className="flex lg:justify-end">
                <Space>
                  <Button icon={<SettingOutlined />} onClick={() => setCategoryModalOpen(true)}>
                    Categorias
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    Nova despesa
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total"
                value={stats.total}
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">{despesas.length} despesas</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pagas"
                value={stats.pagas}
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">
                {stats.total > 0 ? ((stats.pagas / stats.total) * 100).toFixed(1) : 0}% do total
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pendentes"
                value={stats.pendentes}
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">
                {stats.total > 0 ? ((stats.pendentes / stats.total) * 100).toFixed(1) : 0}% do total
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Vencidas"
                value={stats.vencidas}
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">
                {stats.total > 0 ? ((stats.vencidas / stats.total) * 100).toFixed(1) : 0}% do total
              </Typography.Text>
            </Card>
          </Col>
        </Row>

        <Card
          title="Lista de despesas"
          extra={<Tag color="blue">Total filtrado: {filteredDespesas.length}</Tag>}
        >
          <Space className="w-full" size="middle" wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-[220px]"
            />
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="min-w-[200px]"
              options={[
                { label: "Todas", value: "all" },
                ...allCategories.map((catName) => ({ label: catName, value: catName })),
              ]}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="min-w-[180px]"
              options={[
                { label: "Todos", value: "all" },
                { label: "Pago", value: "Pago" },
                { label: "Pendente", value: "Pendente" },
                { label: "Vencido", value: "Vencido" },
              ]}
            />
          </Space>

          <div className="mt-4">
            {filteredDespesas.length === 0 ? (
              <div className="py-10">
                <Empty
                  description={despesas.length === 0 ? "Nenhuma despesa cadastrada" : "Nenhuma despesa encontrada"}
                />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={filteredDespesas}
                rowKey="id"
                pagination={{ pageSize: 10, size: "small" }}
              />
            )}
          </div>
        </Card>
        </div>
      </Spin>

      <Modal
        open={despesaModalOpen}
        onCancel={closeDespesaModal}
        onOk={() => despesaForm.submit()}
        okText={editingId ? "Atualizar" : "Salvar"}
        title={editingId ? "Editar despesa" : "Nova despesa"}
      >
        <Form
          form={despesaForm}
          layout="vertical"
          onFinish={handleDespesaSubmit}
          initialValues={{ data: dayjs(getTodayDateString()), status: "Pendente" }}
        >
          <Form.Item
            label="Descricao"
            name="descricao"
            rules={[{ required: true, message: "Informe a descricao" }]}
          >
            <Input placeholder="Descricao da despesa" />
          </Form.Item>
          <Form.Item
            label="Categoria"
            name="categoria"
            rules={[{ required: true, message: "Selecione a categoria" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={allCategories.map((catName) => ({ label: catName, value: catName }))}
            />
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
            label="Status"
            name="status"
            rules={[{ required: true, message: "Selecione o status" }]}
          >
            <Select
              options={[
                { label: "Pago", value: "Pago" },
                { label: "Pendente", value: "Pendente" },
                { label: "Vencido", value: "Vencido" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={categoryModalOpen}
        onCancel={closeCategoryModal}
        onOk={() => categoryForm.submit()}
        okText={editingCategory ? "Atualizar" : "Adicionar"}
        title="Categorias de despesas"
      >
        <Form form={categoryForm} layout="vertical" onFinish={handleCategorySubmit}>
          <Form.Item
            label="Nome da categoria"
            name="name"
            rules={[{ required: true, message: "Informe o nome da categoria" }]}
          >
            <Input placeholder="Ex: Manutencao, Infraestrutura" />
          </Form.Item>
        </Form>
        <div className="mt-2">
          <Typography.Text strong>Categorias existentes</Typography.Text>
          <List
            className="mt-2"
            dataSource={categories}
            locale={{ emptyText: "Nenhuma categoria personalizada." }}
            renderItem={(cat) => (
              <List.Item
                actions={[
                  <Button type="text" icon={<EditOutlined />} onClick={() => handleEditCategory(cat)} />,
                  <Popconfirm
                    title="Excluir categoria?"
                    okText="Excluir"
                    cancelText="Cancelar"
                    onConfirm={() => handleDeleteCategory(cat.id)}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <Typography.Text>{cat.name}</Typography.Text>
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </ConfigProvider>
  )
}
