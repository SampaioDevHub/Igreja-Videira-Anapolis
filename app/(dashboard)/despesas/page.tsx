"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Trash2, Edit, Settings } from 'lucide-react' 
import { useDespesas } from "@/src/core/hooks/use-despesas"
import { useCategories } from "@/src/core/hooks/use-categories" 
import {
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert"

export default function DespesasPage() {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    data: "",
    status: "Pendente" as "Pago" | "Pendente" | "Vencido",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const { despesas, loading, addDespesa, updateDespesa, deleteDespesa } = useDespesas()
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null)
  const { categories, loading: categoriesLoading, addCategory, updateCategory, deleteCategory } = useCategories("despesaCategories") // Usar o hook genérico com nome da coleção

  const defaultCategories = ["Utilidades", "Pessoal", "Manutenção", "Infraestrutura", "Ministérios", "Água", "Luz", "Energia", "Combustível", "Outros"]
  const allCategories = [...defaultCategories, ...categories.map(cat => cat.name)]


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descricao || !formData.categoria || !formData.valor || !formData.data) {
      Alert({
        title: "Erro",
        variant: "destructive",
      })
      return
    }

    try {
      const despesaData = {
        descricao: formData.descricao,
        categoria: formData.categoria,
        valor: Number.parseFloat(formData.valor),
        data: formData.data,
        status: formData.status,
      }

      if (editingId) {
        await updateDespesa(editingId, despesaData)
        Alert({
          title: "Despesa atualizada!",

        })
      } else {
        await addDespesa(despesaData)
        Alert({
          title: "Despesa adicionada!",

        })
      }

      setFormData({ descricao: "", categoria: "", valor: "", data: "", status: "Pendente" })
      setEditingId(null)
      setOpen(false)
    } catch (error) {
      Alert({
        title: "Erro",

        variant: "destructive",
      })
    }
  }

  const handleEdit = (despesa: any) => {
    setFormData({
      descricao: despesa.descricao,
      categoria: despesa.categoria,
      valor: despesa.valor.toString(),
      data: despesa.data,
      status: despesa.status,
    })
    setEditingId(despesa.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta despesa?")) {
      try {
        await deleteDespesa(id)
        Alert({
          title: "Despesa excluída!",

        })
      } catch (error) {
        Alert({
          title: "Erro",

          variant: "destructive",
        })
      }
    }
  }


  const handleAddOrUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) {
      Alert({ title: "O nome da categoria não pode ser vazio.", variant: "destructive" })
      return
    }
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, newCategoryName)
        Alert({ title: "Categoria atualizada com sucesso!" })
      } else {
        await addCategory(newCategoryName)
        Alert({ title: "Categoria adicionada com sucesso!" })
      }
      setNewCategoryName("")
      setEditingCategory(null)
    } catch (error) {
      Alert({ title: "Erro ao salvar categoria.", variant: "destructive" })
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
        Alert({ title: "Categoria excluída com sucesso!" })
      } catch (error) {
        Alert({ title: "Erro ao excluir categoria.", variant: "destructive" })
      }
    }
  }


  const filteredDespesas = despesas.filter((despesa) => {
    const matchesSearch = despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || despesa.categoria.toLowerCase() === categoryFilter.toLowerCase()
    const matchesStatus = statusFilter === "all" || despesa.status.toLowerCase() === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const stats = {
    total: despesas.reduce((sum, despesa) => sum + despesa.valor, 0),
    pagas: despesas.filter((d) => d.status === "Pago").reduce((sum, d) => sum + d.valor, 0),
    pendentes: despesas.filter((d) => d.status === "Pendente").reduce((sum, d) => sum + d.valor, 0),
    vencidas: despesas.filter((d) => d.status === "Vencido").reduce((sum, d) => sum + d.valor, 0),
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
          <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
          <p className="text-muted-foreground">Controle todas as despesas da igreja</p>
        </div>
        <div className="flex gap-2">
          {/* Diálogo para Gerenciar Categorias de Despesas */}
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
                <DialogTitle>Gerenciar Categorias de Despesas</DialogTitle>
                <DialogDescription>Adicione, edite ou remova categorias personalizadas para despesas.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddOrUpdateCategory} className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newCategoryName">Nome da Categoria</Label>
                  <Input
                    id="newCategoryName"
                    placeholder="Ex: Aluguel, Salários, etc."
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

          {/* Diálogo para Nova/Editar Despesa */}
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen)
              if (!isOpen) {
                setFormData({ descricao: "", categoria: "", valor: "", data: "", status: "Pendente" })
                setEditingId(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Edite os dados da despesa." : "Registre uma nova despesa no sistema."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="descricao" className="text-right">
                      Descrição
                    </Label>
                    <Input
                      id="descricao"
                      placeholder="Descrição da despesa"
                      className="col-span-3"
                      value={formData.descricao}
                      onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categoria" className="text-right">
                      Categoria
                    </Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, categoria: value }))}
                    >
                      <SelectTrigger className="col-span-3">
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="valor" className="text-right">
                      Valor
                    </Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="col-span-3"
                      value={formData.valor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, valor: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="data" className="text-right">
                      Data
                    </Label>
                    <Input
                      id="data"
                      type="date"
                      className="col-span-3"
                      value={formData.data}
                      onChange={(e) => setFormData((prev) => ({ ...prev, data: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "Pago" | "Pendente" | "Vencido") =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Status do pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pago">Pago</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingId ? "Atualizar Despesa" : "Salvar Despesa"}</Button>
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
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{despesas.length} despesas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.pagas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.pagas / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.pendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.pendentes / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.vencidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.vencidas / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
          <CardDescription>Histórico de todas as despesas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar despesas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {allCategories.map((catName) => (
                  <SelectItem key={catName} value={catName}>
                    {catName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredDespesas.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {despesas.length === 0 ? "Nenhuma despesa cadastrada" : "Nenhuma despesa encontrada"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDespesas.map((despesa) => (
                  <TableRow key={despesa.id}>
                    <TableCell className="font-medium">{despesa.descricao}</TableCell>
                    <TableCell className="capitalize">{despesa.categoria}</TableCell>
                    <TableCell>{new Date(despesa.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${despesa.status === "Pago"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : despesa.status === "Pendente"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                      >
                        {despesa.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {despesa.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(despesa)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(despesa.id)}>
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
