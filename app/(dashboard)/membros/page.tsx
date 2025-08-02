"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Trash2, Edit, Users, UserCheck, UserX, Eye, FileText } from "lucide-react"
import { useMembros } from "@/src/core/hooks/use-membros"
import { PDFGenerator } from "@/src/services/firebase/pdf/pdf-generator"


export default function MembrosPage() {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    dataNascimento: "",
    dataCadastro: new Date().toISOString().split("T")[0],
    status: "Ativo" as "Ativo" | "Inativo" | "Visitante",
    observacoes: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { membros, loading, addMembro, updateMembro, deleteMembro } = useMembros()


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome || !formData.dataCadastro) {
      alert({
        title: "Erro",
        description: "Nome e data de cadastro são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingId) {
        await updateMembro(editingId, formData)
        alert({
          title: "Membro atualizado!",
          description: "Os dados do membro foram atualizados com sucesso.",
        })
      } else {
        await addMembro(formData)
        alert({
          title: "Membro cadastrado!",
          description: "O membro foi cadastrado com sucesso.",
        })
      }

      setFormData({
        nome: "",
        email: "",
        telefone: "",
        endereco: "",
        dataNascimento: "",
        dataCadastro: new Date().toISOString().split("T")[0],
        status: "Ativo",
        observacoes: "",
      })
      setEditingId(null)
      setOpen(false)
    } catch (error) {
      alert({
        title: "Erro",
        description: "Erro ao salvar membro.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (membro: any) => {
    setFormData({
      nome: membro.nome,
      email: membro.email || "",
      telefone: membro.telefone || "",
      endereco: membro.endereco || "",
      dataNascimento: membro.dataNascimento || "",
      dataCadastro: membro.dataCadastro,
      status: membro.status,
      observacoes: membro.observacoes || "",
    })
    setEditingId(membro.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este membro?")) {
      try {
        await deleteMembro(id)
        alert({
          title: "Membro excluído!",
          description: "O membro foi excluído com sucesso.",
        })
      } catch (error) {
        alert({
          title: "Erro",
          description: "Erro ao excluir membro.",
          variant: "destructive",
        })
      }
    }
  }

  const generateMembersReport = () => {
    const pdfGenerator = new PDFGenerator()
    pdfGenerator.generateMembersReport(membros)
    pdfGenerator.save(`relatorio-membros-${new Date().toISOString().split("T")[0]}.pdf`)

    alert({
      title: "Relatório gerado!",
      description: "O relatório de membros foi baixado com sucesso.",
    })
  }

  const filteredMembros = membros.filter((membro) => {
    const matchesSearch =
      membro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (membro.email && membro.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || membro.status.toLowerCase() === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: membros.length,
    ativos: membros.filter((m) => m.status === "Ativo").length,
    inativos: membros.filter((m) => m.status === "Inativo").length,
    visitantes: membros.filter((m) => m.status === "Visitante").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Membros
          </h1>
          <p className="text-muted-foreground">Gerencie todos os membros da igreja</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateMembersReport} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Relatório PDF
          </Button>
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen)
              if (!isOpen) {
                setFormData({
                  nome: "",
                  email: "",
                  telefone: "",
                  endereco: "",
                  dataNascimento: "",
                  dataCadastro: new Date().toISOString().split("T")[0],
                  status: "Ativo",
                  observacoes: "",
                })
                setEditingId(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Membro" : "Novo Membro"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Edite os dados do membro." : "Cadastre um novo membro no sistema."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo *</Label>
                      <Input
                        id="nome"
                        placeholder="Nome completo do membro"
                        value={formData.nome}
                        onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "Ativo" | "Inativo" | "Visitante") =>
                          setFormData((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                          <SelectItem value="Visitante">Visitante</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        placeholder="(11) 99999-9999"
                        value={formData.telefone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                      <Input
                        id="dataNascimento"
                        type="date"
                        value={formData.dataNascimento}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dataNascimento: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataCadastro">Data de Cadastro *</Label>
                      <Input
                        id="dataCadastro"
                        type="date"
                        value={formData.dataCadastro}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dataCadastro: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      placeholder="Endereço completo"
                      value={formData.endereco}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endereco: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Observações adicionais sobre o membro"
                      value={formData.observacoes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingId ? "Atualizar Membro" : "Cadastrar Membro"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">membros cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.ativos / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inativos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.inativos / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.visitantes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.visitantes / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Membros</CardTitle>
          <CardDescription>Todos os membros cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="visitante">Visitante</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredMembros.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {membros.length === 0 ? "Nenhum membro cadastrado" : "Nenhum membro encontrado"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembros.map((membro) => (
                  <TableRow key={membro.id}>
                    <TableCell className="font-medium">{membro.nome}</TableCell>
                    <TableCell>{membro.email || "N/A"}</TableCell>
                    <TableCell>{membro.telefone || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          membro.status === "Ativo"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : membro.status === "Visitante"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {membro.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(membro.dataCadastro).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(membro)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(membro.id)}>
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
    </div>
  )
}
