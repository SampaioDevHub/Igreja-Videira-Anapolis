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
import { Plus, Search, Trash2, Edit, Settings } from 'lucide-react' // Adicionado Settings icon
import { useReceitas } from "@/src/core/hooks/use-receitas"
import { useCategories } from "@/src/core/hooks/use-categories" // Importar o hook genérico
import {
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert"


const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseLocalDateString = (value: string) =>
  new Date(value.includes("T") ? value : `${value}T00:00:00`)

export default function ReceitasPage() {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    data: getTodayDateString(),
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const { receitas, loading, addReceita, updateReceita, deleteReceita } = useReceitas()

  // Novos estados e hooks para categorias personalizadas de receitas
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null)
  const { categories, loading: categoriesLoading, addCategory, updateCategory, deleteCategory } = useCategories("receitaCategories") // Usar o hook genérico com nome da coleção

  const defaultCategories = ["Dízimo", "Oferta", "Doação", "Outros"]
  const allCategories = [...defaultCategories, ...categories.map(cat => cat.name)]


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descricao || !formData.categoria || !formData.valor || !formData.data) {
      Alert({
        title: "Todos os campos são obrigatórios.",
   
        variant: "destructive",
      })
      return
    }

    try {
      const receitaData = {
        descricao: formData.descricao,
        categoria: formData.categoria,
        valor: Number.parseFloat(formData.valor),
        data: formData.data,
      }

      if (editingId) {
        await updateReceita(editingId, receitaData)
        Alert({
          title: "A receita foi atualizada com sucesso.",
        })
      } else {
        //@ts-ignore
        await addReceita(receitaData)
        Alert({
          title: "Receita adicionada!",

        })
      }

      setFormData({ descricao: "", categoria: "", valor: "", data: getTodayDateString() })
      setEditingId(null)
      setOpen(false)
    } catch (error) {
      Alert({
        title: "Erro",
        
        variant: "destructive",
      })
    }
  }

  const handleEdit = (receita: any) => {
    setFormData({
      descricao: receita.descricao,
      categoria: receita.categoria,
      valor: receita.valor.toString(),
      data: receita.data,
    })
    setEditingId(receita.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta receita?")) {
      try {
        await deleteReceita(id)
        Alert({
          title: "Receita excluída!",
          
        })
      } catch (error) {
        Alert({
          title: "Erro",
          
          variant: "destructive",
        })
      }
    }
  }

  // Funções para gerenciar categorias personalizadas de receitas
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


  const filteredReceitas = receitas.filter((receita) => {
    const matchesSearch = receita.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || receita.categoria.toLowerCase() === categoryFilter.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: receitas.reduce((sum, receita) => sum + receita.valor, 0),
    dizimos: receitas.filter((r) => r.categoria.toLowerCase() === "dizimo").reduce((sum, r) => sum + r.valor, 0),
    ofertas: receitas.filter((r) => r.categoria.toLowerCase() === "oferta").reduce((sum, r) => sum + r.valor, 0),
    doacoes: receitas.filter((r) => r.categoria.toLowerCase() === "doacao").reduce((sum, r) => sum + r.valor, 0),
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
          <h1 className="text-3xl font-bold tracking-tight">Receitas</h1>
          <p className="text-muted-foreground">Gerencie todas as receitas da igreja</p>
        </div>
        <div className="flex gap-2">
          {/* Diálogo para Gerenciar Categorias de Receitas */}
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
                <DialogTitle>Gerenciar Categorias de Receitas</DialogTitle>
                <DialogDescription>Adicione, edite ou remova categorias personalizadas para receitas.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddOrUpdateCategory} className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newCategoryName">Nome da Categoria</Label>
                  <Input
                    id="newCategoryName"
                    placeholder="Ex: Dízimo, Oferta, Doação, etc."
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

          {/* Diálogo para Nova/Editar Receita */}
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen)
              if (isOpen && !editingId) {
                setFormData((prev) => ({ ...prev, data: getTodayDateString() }))
              }
              if (!isOpen) {
                setFormData({ descricao: "", categoria: "", valor: "", data: getTodayDateString() })
                setEditingId(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Receita
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Receita" : "Nova Receita"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Edite os dados da receita." : "Adicione uma nova receita ao sistema."}
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
                      placeholder="Descrição da receita"
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
                </div>
                <DialogFooter>
                  <Button type="submit">{editingId ? "Atualizar Receita" : "Salvar Receita"}</Button>
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
            <p className="text-xs text-muted-foreground">{receitas.length} receitas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dízimos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.dizimos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.dizimos / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ofertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.ofertas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.ofertas / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.doacoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.doacoes / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Receitas</CardTitle>
          <CardDescription>Histórico de todas as receitas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar receitas..."
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
          </div>

          {filteredReceitas.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {receitas.length === 0 ? "Nenhuma receita cadastrada" : "Nenhuma receita encontrada"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceitas.map((receita) => (
                  <TableRow key={receita.id}>
                    <TableCell className="font-medium">{receita.descricao}</TableCell>
                    <TableCell className="capitalize">{receita.categoria}</TableCell>
                    <TableCell>{parseLocalDateString(receita.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      R$ {receita.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(receita)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(receita.id)}>
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
