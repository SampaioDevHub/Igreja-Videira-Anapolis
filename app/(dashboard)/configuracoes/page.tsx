"use client"

import { useEffect } from "react"
import {
  Avatar,
  Button,
  Card,
  Col,
  ConfigProvider,
  Descriptions,
  Form,
  Input,
  Row,
  Segmented,
  Space,
  Spin,
  Typography,
  notification,
} from "antd"
import {
  BgColorsOutlined,
  HomeOutlined,
  SaveOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons"
import { useTheme } from "next-themes"

import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { useIgrejaConfig } from "@/src/core/hooks/useIgrejaConfig"
import { getAntdTheme } from "@/components/antd-theme"

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [notificationApi, notificationContextHolder] = notification.useNotification()
  const [profileForm] = Form.useForm()
  const [igrejaForm] = Form.useForm()

  const {
    config: igrejaConfig,
    loading: loadingConfig,
    saving: savingConfig,
    saveConfig,
  } = useIgrejaConfig()

  useEffect(() => {
    profileForm.setFieldsValue({
      nome: user?.displayName || "",
      email: user?.email || "",
    })
  }, [profileForm, user])

  useEffect(() => {
    igrejaForm.setFieldsValue({
      nome: igrejaConfig.nome,
      pastor: igrejaConfig.pastor,
      telefone: igrejaConfig.telefone,
      email: igrejaConfig.email,
      cnpj: igrejaConfig.cnpj,
      endereco: igrejaConfig.endereco,
      descricao: igrejaConfig.descricao,
    })
  }, [igrejaConfig, igrejaForm])

  const handleSaveProfile = async () => {
    notificationApi.success({ message: "Perfil atualizado." })
  }

  const handleSaveIgrejaConfig = async (values: Record<string, string>) => {
    try {
      const success = await saveConfig(values)

      if (success) {
        notificationApi.success({ message: "Configuracoes salvas com sucesso." })
      } else {
        notificationApi.error({ message: "Erro ao salvar configuracoes." })
      }
    } catch (error) {
      notificationApi.error({ message: "Erro ao salvar configuracoes." })
    }
  }

  const isLoading = loadingConfig

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
                    Configuracoes
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    Controle as configuracoes do sistema e da igreja.
                  </Typography.Text>
                </Space>
              </Col>
              <Col xs={24} lg={8} className="flex lg:justify-end">
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => igrejaForm.submit()}
                    loading={savingConfig}
                  >
                    Salvar configuracoes
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  Perfil do usuario
                </Space>
              }
            >
              <Space direction="vertical" size="large" className="w-full">
                <Space align="center" size="large" wrap>
                  <Avatar size={64} src={user?.photoURL || undefined} icon={<UserOutlined />} />
                  <Space direction="vertical" size={0}>
                    <Typography.Text strong>{user?.displayName || "Usuario"}</Typography.Text>
                    <Typography.Text type="secondary">{user?.email}</Typography.Text>
                    <Button size="small" onClick={() => notificationApi.info({ message: "Funcao em breve." })}>
                      Alterar foto
                    </Button>
                  </Space>
                </Space>

                <Form form={profileForm} layout="vertical" onFinish={handleSaveProfile}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Nome completo"
                        name="nome"
                        rules={[{ required: true, message: "Informe o nome" }]}
                      >
                        <Input placeholder="Nome completo" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Email" name="email">
                        <Input placeholder="email@dominio.com" disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Button type="primary" icon={<SaveOutlined />} onClick={() => profileForm.submit()}>
                    Salvar perfil
                  </Button>
                </Form>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Space direction="vertical" size="large" className="w-full">
              <Card
                title={
                  <Space>
                    <BgColorsOutlined />
                    Aparencia
                  </Space>
                }
              >
                <Space direction="vertical" size="middle">
                  <Typography.Text type="secondary">Escolha o tema do sistema.</Typography.Text>
                  <Segmented
                    value={theme || "system"}
                    onChange={(value) => setTheme(String(value))}
                    options={[
                      { label: "Claro", value: "light" },
                      { label: "Escuro", value: "dark" },
                      { label: "Sistema", value: "system" },
                    ]}
                  />
                </Space>
              </Card>

              <Card
                title={
                  <Space>
                    <SettingOutlined />
                    Preferencias
                  </Space>
                }
              >
                <Space direction="vertical" size="small">
                  <Typography.Text type="secondary">
                    Em breve voce podera configurar notificacoes e seguranca.
                  </Typography.Text>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>

        <Card
          title={
            <Space>
              <HomeOutlined />
              Informacoes da igreja
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => igrejaForm.submit()}
              loading={savingConfig}
            >
              Salvar
            </Button>
          }
        >
          <Form form={igrejaForm} layout="vertical" onFinish={handleSaveIgrejaConfig}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Nome da igreja"
                  name="nome"
                  rules={[{ required: true, message: "Informe o nome da igreja" }]}
                >
                  <Input placeholder="Ex: Igreja Videira" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Pastor responsavel"
                  name="pastor"
                  rules={[{ required: true, message: "Informe o pastor responsavel" }]}
                >
                  <Input placeholder="Ex: Pastor Joao" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Telefone"
                  name="telefone"
                  rules={[{ required: true, message: "Informe o telefone" }]}
                >
                  <Input placeholder="(11) 99999-9999" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ required: true, message: "Informe o email" }]}
                >
                  <Input placeholder="contato@igreja.com" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="CNPJ" name="cnpj">
                  <Input placeholder="12.345.678/0001-90" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Endereco" name="endereco">
                  <Input placeholder="Rua, numero, bairro" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Descricao" name="descricao">
                  <Input.TextArea rows={4} placeholder="Descricao da igreja" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

          {igrejaConfig.nome ? (
            <Card
              title={
                <Space>
                  <HomeOutlined />
                  Resumo atual
                </Space>
              }
            >
              <Descriptions
                column={{ xs: 1, sm: 2 }}
                items={[
                  { key: "nome", label: "Nome", children: igrejaConfig.nome || "Nao informado" },
                  { key: "pastor", label: "Pastor", children: igrejaConfig.pastor || "Nao informado" },
                  { key: "email", label: "Email", children: igrejaConfig.email || "Nao informado" },
                  { key: "telefone", label: "Telefone", children: igrejaConfig.telefone || "Nao informado" },
                  { key: "cnpj", label: "CNPJ", children: igrejaConfig.cnpj || "Nao informado" },
                  { key: "endereco", label: "Endereco", children: igrejaConfig.endereco || "Nao informado" },
                  { key: "descricao", label: "Descricao", children: igrejaConfig.descricao || "Nao informado" },
                  igrejaConfig.updatedAt
                    ? {
                        key: "updatedAt",
                        label: "Ultima atualizacao",
                        children: new Date(igrejaConfig.updatedAt).toLocaleString("pt-BR"),
                      }
                    : { key: "updatedAt", label: "Ultima atualizacao", children: "Nao informado" },
                ]}
              />
            </Card>
          ) : null}
        </div>
      </Spin>
    </ConfigProvider>
  )
}
