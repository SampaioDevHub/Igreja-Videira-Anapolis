"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, Trash2, Database, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { BackupData, backupService } from "@/src/services/firebase/backup/backup-service"


export default function BackupPage() {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true)
  const [backupInterval, setBackupInterval] = useState("24")
  const [localBackups, setLocalBackups] = useState<BackupData[]>([])
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()


  useEffect(() => {
    loadLocalBackups()
  }, [])

  const loadLocalBackups = () => {
    const backups = backupService.getLocalBackups()
    setLocalBackups(backups)
  }

  const handleCreateBackup = async () => {
    if (!user) return

    setLoading(true)
    try {
      const backup = await backupService.createBackup(user.uid)
      backupService.downloadBackup(backup)

      alert({
        title: "Backup criado!",
        description: "O backup foi baixado com sucesso.",
      })
    } catch (error) {
      alert({
        title: "Erro",
        description: "Erro ao criar backup.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = (backup: BackupData) => {
    backupService.downloadBackup(backup)
    alert({
      title: "Backup baixado!",
      description: "O arquivo foi baixado com sucesso.",
    })
  }

  const handleDeleteBackup = (backupId: string) => {
    if (confirm("Tem certeza que deseja excluir este backup?")) {
      backupService.deleteLocalBackup(backupId)
      loadLocalBackups()
      alert({
        title: "Backup excluído!",
        description: "O backup foi removido com sucesso.",
      })
    }
  }

  const handleImportBackup = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const text = await file.text()
          const backupData = JSON.parse(text)

          // Validar estrutura do backup
          if (!backupData.receitas || !backupData.despesas || !backupData.timestamp) {
            throw new Error("Arquivo de backup inválido")
          }

          alert({
            title: "Backup importado!",
            description: `Backup de ${new Date(backupData.timestamp).toLocaleDateString("pt-BR")} importado com sucesso.`,
          })
        } catch (error) {
          alert({
            title: "Erro",
            description: "Arquivo de backup inválido.",
            variant: "destructive",
          })
        }
      }
    }
    input.click()
  }

  const handleToggleAutoBackup = async (enabled: boolean) => {
    setAutoBackupEnabled(enabled)

    if (enabled && user) {
      await backupService.scheduleAutoBackup(user.uid, Number.parseInt(backupInterval))
      alert({
        title: "Backup automático ativado!",
        description: `Backups serão criados a cada ${backupInterval} horas.`,
      })
    } else {
      alert({
        title: "Backup automático desativado!",
        description: "Os backups automáticos foram pausados.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-8 w-8 text-primary" />
          Backup e Restauração
        </h1>
        <p className="text-muted-foreground">Gerencie backups dos seus dados</p>
      </div>

      {/* Configurações de Backup Automático */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Backup Automático
          </CardTitle>
          <CardDescription>Configure backups automáticos dos seus dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Backup Automático</Label>
              <p className="text-sm text-muted-foreground">Cria backups automaticamente em intervalos regulares</p>
            </div>
            <Switch checked={autoBackupEnabled} onCheckedChange={handleToggleAutoBackup} />
          </div>

          {autoBackupEnabled && (
            <div className="space-y-2">
              <Label>Intervalo do Backup (horas)</Label>
              <Select value={backupInterval} onValueChange={setBackupInterval}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">A cada 6 horas</SelectItem>
                  <SelectItem value="12">A cada 12 horas</SelectItem>
                  <SelectItem value="24">Diariamente</SelectItem>
                  <SelectItem value="168">Semanalmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações de Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Ações de Backup</CardTitle>
          <CardDescription>Crie, baixe ou importe backups manualmente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={handleCreateBackup} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              {loading ? "Criando..." : "Criar Backup"}
            </Button>
            <Button onClick={handleImportBackup} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importar Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Backups Locais */}
      <Card>
        <CardHeader>
          <CardTitle>Backups Locais</CardTitle>
          <CardDescription>Backups armazenados localmente no seu navegador</CardDescription>
        </CardHeader>
        <CardContent>
          {localBackups.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum backup local encontrado</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Receitas</TableHead>
                  <TableHead>Despesas</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localBackups.map((backup: any) => (
                  <TableRow key={backup.id}>
                    <TableCell>{new Date(backup.timestamp).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{backup.receitas?.length || 0}</TableCell>
                    <TableCell>{backup.despesas?.length || 0}</TableCell>
                    <TableCell>{backup.membros?.length || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Completo</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(backup)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteBackup(backup.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Informações sobre Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Os backups incluem todas as receitas, despesas e membros cadastrados</p>
          <p>• Backups automáticos são armazenados localmente no seu navegador</p>
          <p>• Para maior segurança, baixe backups regularmente para seu computador</p>
          <p>• Os backups são específicos por usuário e não incluem dados de outros usuários</p>
          <p>• Ao importar um backup, os dados atuais não são substituídos automaticamente</p>
        </CardContent>
      </Card>
    </div>
  )
}
