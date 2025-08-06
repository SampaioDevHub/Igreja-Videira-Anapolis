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
import { Plus, Search, Trash2, Edit, Users, UserCheck, UserX, Eye, FileText, Settings } from 'lucide-react' // Adicionado Settings icon
import { useMembros } from "@/src/core/hooks/use-membros"
import { useMemberCategories } from "@/src/core/hooks/use-member-categories" 
import { PDFGenerator } from "@/src/services/firebase/Modulo-Pdf/pdf-generator"
import { toast } from "react-toastify"

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
    categoria: "N/A" as string, // Alterado para string
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { membros, loading, addMembro, updateMembro, deleteMembro } = useMembros()

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null)
  const { categories, loading: categoriesLoading, addCategory, updateCategory, deleteCategory } = useMemberCategories()

  const defaultCategories = ["N/A", "Criança", "Jovem", "Adulto"]
  const allCategories = [...defaultCategories, ...categories.map(cat => cat.name)]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome || !formData.dataCadastro) {
      toast.error("Nome e data de cadastro são obrigatórios.")
      return
    }
    try {
      if (editingId) {
        await updateMembro(editingId, formData)
        toast.success("Membro atualizado com sucesso!")
      } else {
        await addMembro(formData)
        toast.success("Membro cadastrado com sucesso!")
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
        categoria: "N/A",
      })
      setEditingId(null)
      setOpen(false)
    } catch (error) {
      toast.error("Erro ao salvar membro.")
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
      categoria: membro.categoria || "N/A",
    })
    setEditingId(membro.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este membro?")) {
      try {
        await deleteMembro(id)
        toast.success("Membro excluído com sucesso!")
      } catch (error) {
        toast.error("Erro ao excluir membro.")
      }
    }
  }

  const generateMembersReport = () => {
    const pdfGenerator = new PDFGenerator()
    pdfGenerator.generateMembersReport(membros)
    pdfGenerator.save(`relatorio-membros-${new Date().toISOString().split("T")[0]}.pdf`)
    toast.success("Relatório de membros gerado com sucesso!")
  }

  // Funções para gerenciar categorias personalizadas
  const handleAddOrUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) {
      toast.error("O nome da categoria não pode ser vazio.")
      return
    }
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, newCategoryName)
        toast.success("Categoria atualizada com sucesso!")
      } else {
        await addCategory(newCategoryName)
        toast.success("Categoria adicionada com sucesso!")
      }
      setNewCategoryName("")
      setEditingCategory(null)
    } catch (error) {
      toast.error("Erro ao salvar categoria.")
    }
  }

  const handleEditCategory = (category: { id: string; name: string }) => {
    setNewCategoryName(category.name)
    setEditingCategory(category)
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        await deleteCategory(id)
        toast.success("Categoria excluída com sucesso!")
      } catch (error) {
        toast.error("Erro ao excluir categoria.")
      }
    }
  }

  const filteredMembros = membros
    .filter((membro) => {
      const matchesSearch =
        membro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (membro.email && membro.email.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === "all" || membro.status.toLowerCase() === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => a.nome.localeCompare(b.nome))

  const stats = {
    total: membros.length,
    ativos: membros.filter((m) => m.status === "Ativo").length,
    inativos: membros.filter((m) => m.status === "Inativo").length,
    visitantes: membros.filter((m) => m.status === "Visitante").length,
  }

  if (loading || categoriesLoading) {
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

          {/* Diálogo para Gerenciar Categorias */}
          <Dialog
            open={categoryDialogOpen}
            onOpenChange={(isOpen) => {
              setCategoryDialogOpen(isOpen)
              if (!isOpen) {
                setNewCategoryName("")
                setEditingCategory(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Categorias
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Gerenciar Categorias</DialogTitle>
                <DialogDescription>Adicione, edite ou remova categorias personalizadas para membros.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddOrUpdateCategory} className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newCategoryName">Nome da Categoria</Label>
                  <Input
                    id="newCategoryName"
                    placeholder="Ex: Voluntário, Liderança, etc."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit">
                  {editingCategory ? "Atualizar Categoria" : "Adicionar Categoria"}
                </Button>
              </form>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Categorias Existentes</h3>
                {categories.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma categoria personalizada adicionada.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {categories.map((cat) => (
                      <li key={cat.id} className="flex items-center justify-between py-2">
                        <span>{cat.name}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditCategory(cat)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(cat.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Diálogo para Novo/Editar Membro */}
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
                  categoria: "N/A",
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
                  {/* Campo de seleção para Categoria (agora com categorias personalizadas) */}
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value: string) =>
                        setFormData((prev) => ({ ...prev, categoria: value }))
                      }
                    >
                      <SelectTrigger id="categoria">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCategories.map((catName) => (
                          <SelectItem key={catName} value={catName}>
                            {catName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Fim do campo de categoria */}
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
                  <TableHead>Categoria</TableHead> {/* Nova coluna */}
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
                    <TableCell>{membro.categoria || "N/A"}</TableCell> {/* Exibir categoria */}
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
