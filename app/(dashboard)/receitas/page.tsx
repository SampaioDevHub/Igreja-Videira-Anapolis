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
import { Plus, Search, Trash2, Edit } from "lucide-react"
import { useReceitas } from "@/src/core/hooks/use-receitas"
import { Alert } from "@/components/ui/alert"


export default function ReceitasPage() {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    data: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const { receitas, loading, addReceita, updateReceita, deleteReceita } = useReceitas()


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
        await addReceita(receitaData)
        Alert({
          title: "Receita adicionada!",

        })
      }

      setFormData({ descricao: "", categoria: "", valor: "", data: "" })
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

  const filteredReceitas = receitas.filter((receita) => {
    const matchesSearch = receita.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || receita.categoria.toLowerCase() === categoryFilter
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: receitas.reduce((sum, receita) => sum + receita.valor, 0),
    dizimos: receitas.filter((r) => r.categoria.toLowerCase() === "dizimo").reduce((sum, r) => sum + r.valor, 0),
    ofertas: receitas.filter((r) => r.categoria.toLowerCase() === "oferta").reduce((sum, r) => sum + r.valor, 0),
    doacoes: receitas.filter((r) => r.categoria.toLowerCase() === "doacao").reduce((sum, r) => sum + r.valor, 0),
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
          <h1 className="text-3xl font-bold tracking-tight">Receitas</h1>
          <p className="text-muted-foreground">Gerencie todas as receitas da igreja</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) {
              setFormData({ descricao: "", categoria: "", valor: "", data: "" })
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
                      <SelectItem value="dizimo">Dízimo</SelectItem>
                      <SelectItem value="oferta">Oferta</SelectItem>
                      <SelectItem value="doacao">Doação</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
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
                <SelectItem value="dizimo">Dízimo</SelectItem>
                <SelectItem value="oferta">Oferta</SelectItem>
                <SelectItem value="doacao">Doação</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
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
                    <TableCell>{new Date(receita.data).toLocaleDateString("pt-BR")}</TableCell>
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
