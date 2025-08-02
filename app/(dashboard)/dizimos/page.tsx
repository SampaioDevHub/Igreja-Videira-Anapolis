"use client"

import type React from "react"
import { useState, useMemo } from "react"
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
import { Plus, Search, Trash2, Edit, PiggyBank, TrendingUp, Users, Calendar } from "lucide-react"
import { useReceitas } from "@/src/core/hooks/use-receitas"


export default function DizimosPage() {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: "",
    membro: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [monthFilter, setMonthFilter] = useState("all")

  const { receitas, loading, addReceita, updateReceita, deleteReceita } = useReceitas()


  // Filtrar apenas dízimos
  const dizimos = useMemo(() => {
    return receitas.filter((receita) => receita.categoria.toLowerCase() === "dizimo")
  }, [receitas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descricao || !formData.valor || !formData.data) {
      alert({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      const dizimoData = {
        descricao: formData.membro ? `Dízimo - ${formData.membro}` : formData.descricao,
        categoria: "dizimo",
        valor: Number.parseFloat(formData.valor),
        data: formData.data,
      }

      if (editingId) {
        await updateReceita(editingId, dizimoData)
        alert({
          title: "Dízimo atualizado!",
          description: "O dízimo foi atualizado com sucesso.",
        })
      } else {
        await addReceita(dizimoData)
        alert({
          title: "Dízimo registrado!",
          description: "O dízimo foi registrado com sucesso.",
        })
      }

      setFormData({ descricao: "", valor: "", data: "", membro: "" })
      setEditingId(null)
      setOpen(false)
    } catch (error) {
      alert({
        title: "Erro",
        description: "Erro ao salvar dízimo.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (dizimo: any) => {
    const membro = dizimo.descricao.replace("Dízimo - ", "")
    setFormData({
      descricao: dizimo.descricao,
      valor: dizimo.valor.toString(),
      data: dizimo.data,
      membro: membro !== dizimo.descricao ? membro : "",
    })
    setEditingId(dizimo.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este dízimo?")) {
      try {
        await deleteReceita(id)
        alert({
          title: "Dízimo excluído!",
          description: "O dízimo foi excluído com sucesso.",
        })
      } catch (error) {
        alert({
          title: "Erro",
          description: "Erro ao excluir dízimo.",
          variant: "destructive",
        })
      }
    }
  }

  const filteredDizimos = dizimos.filter((dizimo) => {
    const matchesSearch = dizimo.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMonth = monthFilter === "all" || new Date(dizimo.data).getMonth() === Number.parseInt(monthFilter)
    return matchesSearch && matchesMonth
  })

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const totalGeral = dizimos.reduce((sum, dizimo) => sum + dizimo.valor, 0)
    const totalMesAtual = dizimos
      .filter((d) => {
        const date = new Date(d.data)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      .reduce((sum, dizimo) => sum + dizimo.valor, 0)

    const membrosUnicos = new Set(dizimos.map((dizimo) => dizimo.descricao.replace("Dízimo - ", ""))).size

    return {
      totalGeral,
      totalMesAtual,
      totalDizimos: dizimos.length,
      membrosContribuintes: membrosUnicos,
    }
  }, [dizimos])

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
            <PiggyBank className="h-8 w-8 text-primary" />
            Dízimos
          </h1>
          <p className="text-muted-foreground">Gerencie todos os dízimos da igreja</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) {
              setFormData({ descricao: "", valor: "", data: "", membro: "" })
              setEditingId(null)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Dízimo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Dízimo" : "Registrar Dízimo"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Edite os dados do dízimo." : "Registre um novo dízimo no sistema."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="membro" className="text-right">
                    Membro
                  </Label>
                  <Input
                    id="membro"
                    placeholder="Nome do membro"
                    className="col-span-3"
                    value={formData.membro}
                    onChange={(e) => setFormData((prev) => ({ ...prev, membro: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descricao" className="text-right">
                    Descrição
                  </Label>
                  <Input
                    id="descricao"
                    placeholder="Descrição adicional (opcional)"
                    className="col-span-3"
                    value={formData.descricao}
                    onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                  />
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
                <Button type="submit">{editingId ? "Atualizar Dízimo" : "Registrar Dízimo"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{stats.totalDizimos} dízimos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mês Atual</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalMesAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contribuintes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.membrosContribuintes}</div>
            <p className="text-xs text-muted-foreground">Membros únicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {stats.totalDizimos > 0
                ? (stats.totalGeral / Math.max(1, stats.totalDizimos / 12)).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })
                : "0,00"}
            </div>
            <p className="text-xs text-muted-foreground">Estimativa baseada no histórico</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Dízimos</CardTitle>
          <CardDescription>Todos os dízimos registrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por membro ou descrição..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                <SelectItem value="0">Janeiro</SelectItem>
                <SelectItem value="1">Fevereiro</SelectItem>
                <SelectItem value="2">Março</SelectItem>
                <SelectItem value="3">Abril</SelectItem>
                <SelectItem value="4">Maio</SelectItem>
                <SelectItem value="5">Junho</SelectItem>
                <SelectItem value="6">Julho</SelectItem>
                <SelectItem value="7">Agosto</SelectItem>
                <SelectItem value="8">Setembro</SelectItem>
                <SelectItem value="9">Outubro</SelectItem>
                <SelectItem value="10">Novembro</SelectItem>
                <SelectItem value="11">Dezembro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredDizimos.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {dizimos.length === 0 ? "Nenhum dízimo registrado" : "Nenhum dízimo encontrado"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro/Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDizimos.map((dizimo) => (
                  <TableRow key={dizimo.id}>
                    <TableCell className="font-medium">{dizimo.descricao}</TableCell>
                    <TableCell>{new Date(dizimo.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      R$ {dizimo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(dizimo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(dizimo.id)}>
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
