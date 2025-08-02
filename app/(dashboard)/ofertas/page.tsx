"use client"

import type React from "react"
import { useState, useMemo } from "react"
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
import { Plus, Search, Trash2, Edit, DollarSign, Heart, Calendar, TrendingUp } from "lucide-react"
import { useReceitas } from "@/src/core/hooks/use-receitas"


export default function OfertasPage() {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    descricao: "",
    tipo: "",
    valor: "",
    data: "",
    observacoes: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState("all")

  const { receitas, loading, addReceita, updateReceita, deleteReceita } = useReceitas()


  // Filtrar apenas ofertas
  const ofertas = useMemo(() => {
    return receitas.filter((receita) => receita.categoria.toLowerCase() === "oferta")
  }, [receitas])

  const tiposOferta = [
    "Oferta de Gratidão",
    "Oferta Especial",
    "Oferta de Missões",
    "Oferta para Construção",
    "Oferta de Amor",
    "Oferta de Páscoa",
    "Oferta de Natal",
    "Oferta de Ano Novo",
    "Outros",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descricao || !formData.valor || !formData.data) {
      alert({
        title: "Erro",
        description: "Descrição, valor e data são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      const ofertaData = {
        descricao: formData.tipo ? `${formData.tipo} - ${formData.descricao}` : formData.descricao,
        categoria: "oferta",
        valor: Number.parseFloat(formData.valor),
        data: formData.data,
      }

      if (editingId) {
        await updateReceita(editingId, ofertaData)
        alert({
          title: "Oferta atualizada!",
          description: "A oferta foi atualizada com sucesso.",
        })
      } else {
        await addReceita(ofertaData)
        alert({
          title: "Oferta registrada!",
          description: "A oferta foi registrada com sucesso.",
        })
      }

      setFormData({ descricao: "", tipo: "", valor: "", data: "", observacoes: "" })
      setEditingId(null)
      setOpen(false)
    } catch (error) {
      alert({
        title: "Erro",
        description: "Erro ao salvar oferta.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (oferta: any) => {
    // Extrair tipo e descrição se estiver no formato "Tipo - Descrição"
    const parts = oferta.descricao.split(" - ")
    const tipo = tiposOferta.includes(parts[0]) ? parts[0] : ""
    const descricao = tipo ? parts.slice(1).join(" - ") : oferta.descricao

    setFormData({
      descricao: descricao,
      tipo: tipo,
      valor: oferta.valor.toString(),
      data: oferta.data,
      observacoes: "",
    })
    setEditingId(oferta.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta oferta?")) {
      try {
        await deleteReceita(id)
        alert({
          title: "Oferta excluída!",
          description: "A oferta foi excluída com sucesso.",
        })
      } catch (error) {
        alert({
          title: "Erro",
          description: "Erro ao excluir oferta.",
          variant: "destructive",
        })
      }
    }
  }

  const filteredOfertas = ofertas.filter((oferta) => {
    const matchesSearch = oferta.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = tipoFilter === "all" || oferta.descricao.toLowerCase().includes(tipoFilter.toLowerCase())
    return matchesSearch && matchesTipo
  })

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const totalGeral = ofertas.reduce((sum, oferta) => sum + oferta.valor, 0)
    const totalMesAtual = ofertas
      .filter((o) => {
        const date = new Date(o.data)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      .reduce((sum, o) => sum + o.valor, 0)

    const maiorOferta = ofertas.length > 0 ? Math.max(...ofertas.map((o) => o.valor)) : 0
    const mediaOferta = ofertas.length > 0 ? totalGeral / ofertas.length : 0

    return {
      totalGeral,
      totalMesAtual,
      totalOfertas: ofertas.length,
      maiorOferta,
      mediaOferta,
    }
  }, [ofertas])

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
            <Heart className="h-8 w-8 text-primary" />
            Ofertas
          </h1>
          <p className="text-muted-foreground">Gerencie todas as ofertas da igreja</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) {
              setFormData({ descricao: "", tipo: "", valor: "", data: "", observacoes: "" })
              setEditingId(null)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Oferta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Oferta" : "Registrar Oferta"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Edite os dados da oferta." : "Registre uma nova oferta no sistema."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tipo" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo de oferta" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposOferta.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descricao" className="text-right">
                    Descrição
                  </Label>
                  <Input
                    id="descricao"
                    placeholder="Descrição da oferta"
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
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="observacoes" className="text-right mt-2">
                    Observações
                  </Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Observações adicionais (opcional)"
                    className="col-span-3"
                    value={formData.observacoes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingId ? "Atualizar Oferta" : "Registrar Oferta"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{stats.totalOfertas} ofertas registradas</p>
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
            <CardTitle className="text-sm font-medium">Maior Oferta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.maiorOferta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Maior valor registrado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.mediaOferta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Valor médio por oferta</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ofertas</CardTitle>
          <CardDescription>Todas as ofertas registradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ofertas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tiposOferta.map((tipo) => (
                  <SelectItem key={tipo} value={tipo.toLowerCase()}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredOfertas.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {ofertas.length === 0 ? "Nenhuma oferta registrada" : "Nenhuma oferta encontrada"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOfertas.map((oferta) => (
                  <TableRow key={oferta.id}>
                    <TableCell className="font-medium">{oferta.descricao}</TableCell>
                    <TableCell>{new Date(oferta.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      R$ {oferta.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(oferta)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(oferta.id)}>
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
