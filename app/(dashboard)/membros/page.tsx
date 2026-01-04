"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  notification,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  HomeOutlined,
  MailOutlined,
  PhoneOutlined,
  SearchOutlined,
  SettingOutlined,
  TagOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTheme } from "next-themes";

import { getAntdTheme } from "@/components/antd-theme";
import { useMembros } from "@/src/core/hooks/use-membros";
import { useMemberCategories } from "@/src/core/hooks/use-member-categories";
import { PDFGenerator } from "@/src/services/firebase/Modulo-Pdf/pdf-generator";

type Membro = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  dataNascimento?: string;
  dataCadastro: string;
  status: "Ativo" | "Inativo" | "Visitante";
  observacoes?: string;
  categoria?: string;
};

type Category = {
  id: string;
  name: string;
};

const defaultCategories = ["N/A", "Criança", "Jovem", "Adulto"];

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function MembrosPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [notificationApi, notificationContextHolder] =
    notification.useNotification();
  const [modal, modalContextHolder] = Modal.useModal();

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [memberForm] = Form.useForm();
  const [categoryForm] = Form.useForm();

  const { membros, loading, addMembro, updateMembro, deleteMembro } =
    useMembros();
  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useMemberCategories();

  const allCategories = useMemo(
    () => [...defaultCategories, ...categories.map((cat) => cat.name)],
    [categories]
  );

  const stats = useMemo(
    () => ({
      total: membros.length,
      ativos: membros.filter((m) => m.status === "Ativo").length,
      inativos: membros.filter((m) => m.status === "Inativo").length,
      visitantes: membros.filter((m) => m.status === "Visitante").length,
    }),
    [membros]
  );

  const filteredMembros = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    return membros
      .filter((membro) => {
        const matchesSearch =
          normalizeText(membro.nome).includes(normalizedSearch) ||
          normalizeText(membro.email || "").includes(normalizedSearch);
        const matchesStatus =
          statusFilter === "all" ||
          membro.status.toLowerCase() === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [membros, searchTerm, statusFilter]);

  const resetMemberForm = () => {
    memberForm.resetFields();
    memberForm.setFieldsValue({
      status: "Ativo",
      categoria: "N/A",
      dataCadastro: dayjs(),
    });
  };

  const openNewMember = () => {
    setEditingId(null);
    resetMemberForm();
    setMemberModalOpen(true);
  };

  const openEditMember = (membro: Membro) => {
    setEditingId(membro.id);
    memberForm.setFieldsValue({
      nome: membro.nome,
      email: membro.email || "",
      telefone: membro.telefone || "",
      endereco: membro.endereco || "",
      dataNascimento: membro.dataNascimento
        ? dayjs(membro.dataNascimento)
        : null,
      dataCadastro: membro.dataCadastro ? dayjs(membro.dataCadastro) : dayjs(),
      status: membro.status,
      observacoes: membro.observacoes || "",
      categoria: membro.categoria || "N/A",
    });
    setMemberModalOpen(true);
  };

  const handleSubmitMember = async (values: any) => {
    const payload = {
      nome: values.nome,
      email: values.email || "",
      telefone: values.telefone || "",
      endereco: values.endereco || "",
      dataNascimento: values.dataNascimento
        ? values.dataNascimento.format("YYYY-MM-DD")
        : "",
      dataCadastro: values.dataCadastro
        ? values.dataCadastro.format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
      status: values.status,
      observacoes: values.observacoes || "",
      categoria: values.categoria || "N/A",
    };

    try {
      if (editingId) {
        await updateMembro(editingId, payload);
        notificationApi.success({
          message: "Membro atualizado",
          description: "As informações foram salvas com sucesso.",
          placement: "topRight",
        });
      } else {
        await addMembro(payload);
        notificationApi.success({
          message: "Membro cadastrado",
          description: "O novo membro foi registrado com sucesso.",
          placement: "topRight",
        });
      }
      setMemberModalOpen(false);
      setEditingId(null);
      resetMemberForm();
    } catch (error) {
      notificationApi.error({
        message: "Erro ao salvar",
        description: "Não foi possível salvar o membro agora.",
        placement: "topRight",
      });
    }
  };

  const handleDeleteMember = (id: string) => {
    modal.confirm({
      title: "Excluir membro?",
      content: "Esta ação não pode ser desfeita.",
      okText: "Excluir",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await deleteMembro(id);
          notificationApi.success({
            message: "Membro excluído",
            description: "O registro foi removido com sucesso.",
            placement: "topRight",
          });
        } catch (error) {
          notificationApi.error({
            message: "Erro ao excluir",
            description: "Não foi possível excluir o membro agora.",
            placement: "topRight",
          });
        }
      },
    });
  };

  const generateMembersReport = () => {
    try {
      const pdfGenerator = new PDFGenerator();
      pdfGenerator.generateMembersReport(membros);
      pdfGenerator.save(
        `relatorio-membros-${new Date().toISOString().split("T")[0]}.pdf`
      );
      notificationApi.success({
        message: "Relatório gerado",
        description: "O PDF dos membros foi baixado com sucesso.",
        placement: "topRight",
      });
    } catch (error) {
      notificationApi.error({
        message: "Erro ao gerar PDF",
        description: "Não foi possível gerar o relatório agora.",
        placement: "topRight",
      });
    }
  };

  const handleCategorySubmit = async (values: { name: string }) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, values.name);
        notificationApi.success({
          message: "Categoria atualizada",
          description: "A categoria foi atualizada com sucesso.",
          placement: "topRight",
        });
      } else {
        await addCategory(values.name);
        notificationApi.success({
          message: "Categoria adicionada",
          description: "A nova categoria foi adicionada.",
          placement: "topRight",
        });
      }
      categoryForm.resetFields();
      setEditingCategory(null);
    } catch (error) {
      notificationApi.error({
        message: "Erro ao salvar",
        description: "Não foi possível salvar a categoria agora.",
        placement: "topRight",
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.setFieldsValue({ name: category.name });
  };

  const handleDeleteCategory = (id: string) => {
    modal.confirm({
      title: "Excluir categoria?",
      content: "Os membros vinculados permanecerão com a categoria atual.",
      okText: "Excluir",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await deleteCategory(id);
          notificationApi.success({
            message: "Categoria removida",
            description: "A categoria foi removida com sucesso.",
            placement: "topRight",
          });
        } catch (error) {
          notificationApi.error({
            message: "Erro ao remover",
            description: "Não foi possível remover a categoria agora.",
            placement: "topRight",
          });
        }
      },
    });
  };

  const memberColumns: ColumnsType<Membro> = [
    {
      title: "Nome",
      dataIndex: "nome",
      key: "nome",
      render: (value: string) => (
        <Space>
          <UserOutlined />
          <Typography.Text strong>{value}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (value?: string) => (
        <Space size={6}>
          <MailOutlined />
          <span>{value || "N/A"}</span>
        </Space>
      ),
    },
    {
      title: "Telefone",
      dataIndex: "telefone",
      key: "telefone",
      render: (value?: string) => (
        <Space size={6}>
          <PhoneOutlined />
          <span>{value || "N/A"}</span>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: Membro["status"]) => {
        const color =
          value === "Ativo" ? "green" : value === "Visitante" ? "blue" : "red";
        return <Tag color={color}>{value}</Tag>;
      },
    },
    {
      title: "Categoria",
      dataIndex: "categoria",
      key: "categoria",
      render: (value?: string) => (
        <Tag icon={<UserOutlined />} color="geekblue">
          {value || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Cadastro",
      dataIndex: "dataCadastro",
      key: "dataCadastro",
      render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Ações",
      key: "acoes",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditMember(record)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteMember(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider theme={getAntdTheme(isDark)}>
      {notificationContextHolder}
      {modalContextHolder}
      <Spin spinning={loading || categoriesLoading} tip="Carregando membros...">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm dark:border-slate-700/70 dark:from-slate-900/70 dark:via-slate-900 dark:to-slate-800/70">
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={16}>
                <Space direction="vertical" size="small">
                  <Space align="center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                      <TeamOutlined className="text-xl" />
                    </div>
                    <div>
                      <Typography.Title level={3} className="m-0">
                        Membros
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        Gestão completa dos membros, categorias e comunicações.
                      </Typography.Text>
                    </div>
                  </Space>
                  <Space size="small" wrap>
                    <Tag color="blue">{stats.total} cadastrados</Tag>
                    <Tag color="green">{stats.ativos} ativos</Tag>
                    <Tag color="gold">{stats.visitantes} visitantes</Tag>
                  </Space>
                </Space>
              </Col>

              <Col
                xs={24}
                lg={20}
                className="flex items-center justify-start lg:justify-end"
              >
                <Space size="middle" wrap>
                  <Button
                    icon={<FileTextOutlined />}
                    onClick={generateMembersReport}
                  >
                    Relatório PDF
                  </Button>

                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => setCategoryModalOpen(true)}
                  >
                    Categorias
                  </Button>

                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={openNewMember}
                  >
                    Novo membro
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
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Ativos"
                  value={stats.ativos}
                  valueStyle={{ color: "#16a34a" }}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Inativos"
                  value={stats.inativos}
                  valueStyle={{ color: "#ef4444" }}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Visitantes"
                  value={stats.visitantes}
                  valueStyle={{ color: "#3b82f6" }}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title={
              <Space>
                <SearchOutlined /> Filtros e pesquisa
              </Space>
            }
          >
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} lg={16}>
                <Input
                  allowClear
                  placeholder="Buscar por nome ou email"
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col xs={24} lg={8}>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="w-full"
                  options={[
                    { value: "all", label: "Todos os status" },
                    { value: "ativo", label: "Ativos" },
                    { value: "inativo", label: "Inativos" },
                    { value: "visitante", label: "Visitantes" },
                  ]}
                />
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <TeamOutlined /> Lista de membros
              </Space>
            }
            extra={<Tag color="blue">{filteredMembros.length} registros</Tag>}
          >
            <Table
              columns={memberColumns}
              dataSource={filteredMembros}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: "Nenhum membro encontrado" }}
              scroll={{ x: 900 }}
            />
          </Card>
        </div>
      </Spin>

      <Modal
        title={editingId ? "Editar membro" : "Novo membro"}
        open={memberModalOpen}
        onCancel={() => {
          setMemberModalOpen(false);
          setEditingId(null);
          resetMemberForm();
        }}
        onOk={() => memberForm.submit()}
        okText={editingId ? "Salvar" : "Cadastrar"}
        cancelText="Cancelar"
        width={720}
      >
        <Form form={memberForm} layout="vertical" onFinish={handleSubmitMember}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Nome completo"
                name="nome"
                rules={[
                  { required: true, message: "Informe o nome do membro" },
                ]}
              >
                <Input placeholder="Nome completo" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: "Ativo", label: "Ativo" },
                    { value: "Inativo", label: "Inativo" },
                    { value: "Visitante", label: "Visitante" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Email" name="email">
                <Input placeholder="email@exemplo.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Telefone" name="telefone">
                <Input placeholder="(00) 00000-0000" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Data de nascimento" name="dataNascimento">
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Data de cadastro"
                name="dataCadastro"
                rules={[
                  { required: true, message: "Informe a data de cadastro" },
                ]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Categoria" name="categoria">
                <Select
                  options={allCategories.map((cat) => ({
                    value: cat,
                    label: cat,
                  }))}
                  placeholder="Selecione a categoria"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Endereço" name="endereco">
                <Input
                  prefix={<HomeOutlined />}
                  placeholder="Endereço completo"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Observações" name="observacoes">
                <Input.TextArea rows={3} placeholder="Observações adicionais" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Categorias de membros"
        open={categoryModalOpen}
        onCancel={() => {
          setCategoryModalOpen(false);
          categoryForm.resetFields();
          setEditingCategory(null);
        }}
        footer={null}
        width={640}
      >
        <Space direction="vertical" size="large" className="w-full">
          <Card size="small" className="bg-transparent" bordered>
            <Space direction="vertical" className="w-full">
              <Typography.Text type="secondary">
                Categorias padrão: {defaultCategories.join(", ")}
              </Typography.Text>
            </Space>
          </Card>

          <Form
            form={categoryForm}
            layout="vertical"
            onFinish={handleCategorySubmit}
          >
            <Row gutter={[16, 0]} align="middle">
              <Col xs={24} md={16}>
                <Form.Item
                  label="Nome da categoria"
                  name="name"
                  rules={[
                    { required: true, message: "Informe o nome da categoria" },
                  ]}
                >
                  <Input
                    prefix={<TagOutlined />}
                    placeholder="Ex: Voluntário, Liderança"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label=" " colon={false}>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      {editingCategory ? "Atualizar" : "Adicionar"}
                    </Button>
                    {editingCategory && (
                      <Button
                        onClick={() => {
                          setEditingCategory(null);
                          categoryForm.resetFields();
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Table
            dataSource={categories}
            rowKey="id"
            pagination={false}
            size="small"
            locale={{ emptyText: "Nenhuma categoria personalizada" }}
            columns={[
              {
                title: "Categoria",
                dataIndex: "name",
                key: "name",
                render: (value: string) => (
                  <Typography.Text>{value}</Typography.Text>
                ),
              },
              {
                title: "Ações",
                key: "actions",
                align: "right",
                render: (_: unknown, record: Category) => (
                  <Space>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditCategory(record)}
                    />
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteCategory(record.id)}
                    />
                  </Space>
                ),
              },
            ]}
          />
        </Space>
      </Modal>
    </ConfigProvider>
  );
}
