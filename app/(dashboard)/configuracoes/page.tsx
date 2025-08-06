"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Settings,
  User,
  Palette,
  Church,
  Save,
  Loader2,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { useIgrejaConfig } from "@/src/core/hooks/useIgrejaConfig"


export default function ConfiguracoesPage() {
  const { user } = useAuth()

  const { theme, setTheme } = useTheme()
  const {
    config: igrejaConfig,
    loading: loadingConfig,
    saving: savingConfig,
    saveConfig,
    updateConfig,
  } = useIgrejaConfig()

  const handleSaveIgrejaConfig = async () => {
    const success = await saveConfig(igrejaConfig)

    if (success) {
      alert({
        title: "Configurações salvas!",
        description: "As informações da igreja foram atualizadas com sucesso.",
      })
    } else {
      alert({
        title: "Erro",
        description: "Erro ao salvar as configurações da igreja.",
        variant: "destructive",
      })
    }
  }

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema e da igreja</p>
      </div>

      {/* Perfil do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil do Usuário
          </CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.photoURL || ""} alt="Avatar" />
              <AvatarFallback className="text-lg">
                {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{user?.displayName || "Usuário"}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <Button variant="outline" size="sm">Alterar Foto</Button>
            </div>
          </div>

          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" defaultValue={user?.displayName || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ""} disabled />
            </div>
          </div>
          <Button onClick={() => alert({ title: "Perfil atualizado!", description: "Suas informações foram salvas." })}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Perfil
          </Button>
        </CardContent>
      </Card>

      {/* Informações da Igreja */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="h-5 w-5" />
            Informações da Igreja
          </CardTitle>
          <CardDescription>Configure os dados da sua igreja</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomeIgreja">Nome da Igreja</Label>
              <Input
                id="nomeIgreja"
                placeholder="Ex: Igreja Videira"
                value={igrejaConfig.nome}
                onChange={(e) => updateConfig({ nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pastor">Pastor Responsável</Label>
              <Input
                id="pastor"
                placeholder="Ex: Pastor João Silva"
                value={igrejaConfig.pastor}
                onChange={(e) => updateConfig({ pastor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefoneIgreja">Telefone</Label>
              <Input
                id="telefoneIgreja"
                placeholder="(11) 99999-9999"
                value={igrejaConfig.telefone}
                onChange={(e) => updateConfig({ telefone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailIgreja">Email</Label>
              <Input
                id="emailIgreja"
                type="email"
                placeholder="contato@igreja.com"
                value={igrejaConfig.email}
                onChange={(e) => updateConfig({ email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="12.345.678/0001-90"
                value={igrejaConfig.cnpj}
                onChange={(e) => updateConfig({ cnpj: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço Completo</Label>
            <Input
              id="endereco"
              placeholder="Rua das Flores, 123 - Centro - Cidade/UF"
              value={igrejaConfig.endereco}
              onChange={(e) => updateConfig({ endereco: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Uma breve descrição sobre a igreja..."
              value={igrejaConfig.descricao}
              onChange={(e) => updateConfig({ descricao: e.target.value })}
              rows={3}
            />
          </div>
          <Button onClick={handleSaveIgrejaConfig} disabled={savingConfig}>
            {savingConfig ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Informações
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Notificações */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>Configure suas preferências de notificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email - Receitas</Label>
                <p className="text-sm text-muted-foreground">Receba emails quando novas receitas forem registradas</p>
              </div>
              <Switch
                checked={notificacoes.emailReceitas}
                onCheckedChange={(checked) => setNotificacoes((prev) => ({ ...prev, emailReceitas: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email - Despesas</Label>
                <p className="text-sm text-muted-foreground">Receba emails quando novas despesas forem registradas</p>
              </div>
              <Switch
                checked={notificacoes.emailDespesas}
                onCheckedChange={(checked) => setNotificacoes((prev) => ({ ...prev, emailDespesas: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Relatórios por Email</Label>
                <p className="text-sm text-muted-foreground">Receba relatórios mensais por email</p>
              </div>
              <Switch
                checked={notificacoes.emailRelatorios}
                onCheckedChange={(checked) => setNotificacoes((prev) => ({ ...prev, emailRelatorios: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
              </div>
              <Switch
                checked={notificacoes.pushNotifications}
                onCheckedChange={(checked) => setNotificacoes((prev) => ({ ...prev, pushNotifications: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Lembretes de Despesas</Label>
                <p className="text-sm text-muted-foreground">Receba lembretes de despesas vencidas</p>
              </div>
              <Switch
                checked={notificacoes.lembretesDespesas}
                onCheckedChange={(checked) => setNotificacoes((prev) => ({ ...prev, lembretesDespesas: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Resumo Mensal</Label>
                <p className="text-sm text-muted-foreground">Receba um resumo financeiro mensal</p>
              </div>
              <Switch
                checked={notificacoes.resumoMensal}
                onCheckedChange={(checked) => setNotificacoes((prev) => ({ ...prev, resumoMensal: checked }))}
              />
            </div>
          </div>
          <Button onClick={handleSaveNotificacoes}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Notificações
          </Button>
        </CardContent>
      </Card> */}


      {/* Segurança */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>Configure as opções de segurança do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autenticação de Dois Fatores</Label>
                <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
              </div>
              <Switch
                checked={seguranca.autenticacaoDoisFatores}
                onCheckedChange={(checked) => setSeguranca((prev) => ({ ...prev, autenticacaoDoisFatores: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Backup Automático</Label>
                <p className="text-sm text-muted-foreground">Faça backup automático dos dados</p>
              </div>
              <Switch
                checked={seguranca.backupAutomatico}
                onCheckedChange={(checked) => setSeguranca((prev) => ({ ...prev, backupAutomatico: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Log de Auditoria</Label>
                <p className="text-sm text-muted-foreground">Registre todas as ações do sistema</p>
              </div>
              <Switch
                checked={seguranca.logAuditoria}
                onCheckedChange={(checked) => setSeguranca((prev) => ({ ...prev, logAuditoria: checked }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessaoExpira">Sessão expira em (minutos)</Label>
              <Input
                id="sessaoExpira"
                type="number"
                value={seguranca.sessaoExpira}
                onChange={(e) => setSeguranca((prev) => ({ ...prev, sessaoExpira: e.target.value }))}
                className="w-32"
              />
            </div>
          </div>
          <Button onClick={handleSaveSeguranca}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Segurança
          </Button>
        </CardContent>
      </Card> */}


      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>Personalize a aparência do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema</Label>
            <div className="flex gap-2">
              <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}>
                Claro
              </Button>
              <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>
                Escuro
              </Button>
              <Button variant={theme === "system" ? "default" : "outline"} size="sm" onClick={() => setTheme("system")}>
                Sistema
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados e Backup */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dados e Backup
          </CardTitle>
          <CardDescription>Gerencie seus dados e backups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Exportar Dados
            </Button>
            <Button onClick={handleImportData} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Upload className="h-4 w-4" />
              Importar Dados
            </Button>
            <Button onClick={handleDeleteAllData} variant="destructive" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Excluir Todos os Dados
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>• Exportar: Baixe todos os seus dados em formato JSON</p>
            <p>• Importar: Carregue dados de um backup anterior</p>
            <p>• Excluir: Remove permanentemente todos os dados (não pode ser desfeito)</p>
          </div>
        </CardContent>
      </Card> */}


      {/* Informações da Configuração Atual */}
      {igrejaConfig.nome && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Church className="h-5 w-5 text-green-600" />
              Configuração Atual da Igreja
            </CardTitle>
            <CardDescription>Resumo das informações salvas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Nome:</strong> {igrejaConfig.nome || "Não informado"}
              </div>
              <div>
                <strong>Pastor:</strong> {igrejaConfig.pastor || "Não informado"}
              </div>
              <div>
                <strong>Email:</strong> {igrejaConfig.email || "Não informado"}
              </div>
              <div>
                <strong>Telefone:</strong> {igrejaConfig.telefone || "Não informado"}
              </div>
              <div className="md:col-span-2">
                <strong>Endereço:</strong> {igrejaConfig.endereco || "Não informado"}
              </div>
              {igrejaConfig.updatedAt && (
                <div className="md:col-span-2 text-muted-foreground">
                  <strong>Última atualização:</strong> {new Date(igrejaConfig.updatedAt).toLocaleString("pt-BR")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
