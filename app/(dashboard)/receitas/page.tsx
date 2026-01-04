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

export default function ReceitasPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [notificationApi, notificationContextHolder] = notification.useNotification()

  const [receitaModalOpen, setReceitaModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const [receitaForm] = Form.useForm()
  const [categoryForm] = Form.useForm()

  const { receitas, loading, addReceita, updateReceita, deleteReceita } = useReceitas()
  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories("receitaCategories")

  const defaultCategories = ["Dizimo", "Oferta", "Doacao", "Outros"]
  const allCategories = useMemo(() => {
    const names = [...defaultCategories, ...categories.map((cat) => cat.name)]
    return Array.from(new Set(names))
  }, [categories])

  const stats = useMemo(() => {
    const total = receitas.reduce((sum, receita) => sum + receita.valor, 0)
    const dizimos = receitas
      .filter((r) => normalizeText(r.categoria) === "dizimo")
      .reduce((sum, r) => sum + r.valor, 0)
    const ofertas = receitas
      .filter((r) => normalizeText(r.categoria) === "oferta")
      .reduce((sum, r) => sum + r.valor, 0)
    const doacoes = receitas
      .filter((r) => normalizeText(r.categoria) === "doacao")
      .reduce((sum, r) => sum + r.valor, 0)

    return { total, dizimos, ofertas, doacoes }
  }, [receitas])

  const filteredReceitas = useMemo(() => {
    return receitas.filter((receita) => {
      const matchesSearch = receita.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        categoryFilter === "all" || normalizeText(receita.categoria) === normalizeText(categoryFilter)
      return matchesSearch && matchesCategory
    })
  }, [receitas, searchTerm, categoryFilter])

  const openCreateModal = () => {
    setEditingId(null)
    receitaForm.setFieldsValue({
      descricao: "",
      categoria: undefined,
      valor: undefined,
      data: dayjs(getTodayDateString()),
    })
    setReceitaModalOpen(true)
  }

  const handleEdit = (receita: Receita) => {
    setEditingId(receita.id)
    receitaForm.setFieldsValue({
      descricao: receita.descricao,
      categoria: receita.categoria,
      valor: receita.valor,
      data: dayjs(receita.data),
    })
    setReceitaModalOpen(true)
  }

  const handleReceitaSubmit = async () => {
    try {
      const values = await receitaForm.validateFields()
      const receitaData = {
        descricao: values.descricao,
        categoria: values.categoria,
        valor: Number(values.valor),
        data: values.data.format("YYYY-MM-DD"),
      }

      if (editingId) {
        await updateReceita(editingId, receitaData)
        notificationApi.success({ message: "Receita atualizada com sucesso." })
      } else {
        //@ts-ignore
        await addReceita(receitaData)
        notificationApi.success({ message: "Receita adicionada com sucesso." })
      }

      setReceitaModalOpen(false)
      setEditingId(null)
      receitaForm.resetFields()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      notificationApi.error({ message: "Erro ao salvar receita." })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteReceita(id)
      notificationApi.success({ message: "Receita excluida com sucesso." })
    } catch (error) {
      notificationApi.error({ message: "Erro ao excluir receita." })
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

  const closeReceitaModal = () => {
    setReceitaModalOpen(false)
    setEditingId(null)
    receitaForm.resetFields()
  }

  const columns: TableProps<Receita>["columns"] = [
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
            title="Excluir receita?"
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
                    Receitas
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    Controle completo das receitas registradas.
                  </Typography.Text>
                </Space>
              </Col>
              <Col xs={24} lg={20} className="flex lg:justify-end">
                <Space>
                  <Button icon={<SettingOutlined />} onClick={() => setCategoryModalOpen(true)}>
                    Categorias
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    Nova receita
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
              <Typography.Text type="secondary">{receitas.length} receitas</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card >
              <Statistic
                title="Dizimos"
                value={stats.dizimos}
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">
                {stats.total > 0 ? ((stats.dizimos / stats.total) * 100).toFixed(1) : 0}% do total
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Ofertas"
                value={stats.ofertas}
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">
                {stats.total > 0 ? ((stats.ofertas / stats.total) * 100).toFixed(1) : 0}% do total
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Doacoes"
                value={stats.doacoes}
                formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Typography.Text type="secondary">
                {stats.total > 0 ? ((stats.doacoes / stats.total) * 100).toFixed(1) : 0}% do total
              </Typography.Text>
            </Card>
          </Col>
        </Row>

        <Card
          title="Lista de receitas"
          extra={<Tag color="blue">Total filtrado: {filteredReceitas.length}</Tag>}
        >
          <Space className="w-full" size="middle" wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Buscar receitas..."
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
          </Space>

          <div className="mt-4">
            {filteredReceitas.length === 0 ? (
              <div className="py-10">
                <Empty
                  description={receitas.length === 0 ? "Nenhuma receita cadastrada" : "Nenhuma receita encontrada"}
                />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={filteredReceitas}
                rowKey="id"
                pagination={{ pageSize: 10, size: "small" }}
              />
            )}
          </div>
        </Card>
        </div>
      </Spin>

      <Modal
        open={receitaModalOpen}
        onCancel={closeReceitaModal}
        onOk={() => receitaForm.submit()}
        okText={editingId ? "Atualizar" : "Salvar"}
        title={editingId ? "Editar receita" : "Nova receita"}
      >
        <Form
          form={receitaForm}
          layout="vertical"
          onFinish={handleReceitaSubmit}
          initialValues={{ data: dayjs(getTodayDateString()) }}
        >
          <Form.Item
            label="Descricao"
            name="descricao"
            rules={[{ required: true, message: "Informe a descricao" }]}
          >
            <Input placeholder="Descricao da receita" />
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
        </Form>
      </Modal>

      <Modal
        open={categoryModalOpen}
        onCancel={closeCategoryModal}
        onOk={() => categoryForm.submit()}
        okText={editingCategory ? "Atualizar" : "Adicionar"}
        title="Categorias de receitas"
      >
        <Form form={categoryForm} layout="vertical" onFinish={handleCategorySubmit}>
          <Form.Item
            label="Nome da categoria"
            name="name"
            rules={[{ required: true, message: "Informe o nome da categoria" }]}
          >
            <Input placeholder="Ex: Dizimo, Oferta, Doacao" />
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
