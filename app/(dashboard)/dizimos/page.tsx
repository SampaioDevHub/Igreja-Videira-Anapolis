"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Trash2, Edit, PiggyBank, TrendingUp, Users, Calendar, QrCode, Banknote, CreditCard, Smartphone, Settings } from 'lucide-react'
import { useReceitas } from "@/src/core/hooks/use-receitas"
import { useCategories } from "@/src/core/hooks/use-categories"
import { toast } from 'react-toastify'

const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseLocalDateString = (value: string) =>
  new Date(value.includes("T") ? value : `${value}T00:00:00`)


export default function DizimosPage() {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: getTodayDateString(),
    membro: "",
    formaPagamento: "",
    observacoes: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [monthFilter, setMonthFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")

  const { receitas, loading, addReceita, updateReceita, deleteReceita } = useReceitas()
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false)
  const [newPaymentMethodName, setNewPaymentMethodName] = useState("")
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<{ id: string; name: string } | null>(null)
  const { categories: customPaymentMethods, loading: customPaymentMethodsLoading, addCategory: addCustomPaymentMethod, updateCategory: updateCustomPaymentMethod, deleteCategory: deleteCustomPaymentMethod } = useCategories("paymentMethods") // Usar a mesma coleção de formas de pagamento das ofertas

  const defaultPaymentMethods = [
    {
      value: "pix",
      label: "PIX",
      icon: QrCode,
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      iconColor: "text-green-600",
    },
    {
      value: "cartao-debito",
      label: "Cartão de Débito",
      icon: CreditCard,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      iconColor: "text-blue-600",
    },
    {
      value: "cartao-credito",
      label: "Cartão de Crédito",
      icon: CreditCard,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      iconColor: "text-purple-600",
    },
    {
      value: "dinheiro",
      label: "Dinheiro",
      icon: Banknote,
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      iconColor: "text-yellow-600",
    },
    {
      value: "transferencia",
      label: "Transferência",
      icon: Smartphone,
      color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      iconColor: "text-indigo-600",
    },
  ]

  const allPaymentMethods = useMemo(() => {
    const customMapped = customPaymentMethods.map(pm => ({
      value: pm.name.toLowerCase().replace(/\s/g, '-'), 
      label: pm.name,
      icon: Banknote, 
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      iconColor: "text-gray-600",
    }));
    
    const combined = [...defaultPaymentMethods.filter(dp => !customMapped.some(cm => cm.value === dp.value)), ...customMapped];
    return combined;
  }, [defaultPaymentMethods, customPaymentMethods]);


  // Filtrar apenas dízimos
  const dizimos = useMemo(() => {
    return receitas.filter((receita) => receita.categoria.toLowerCase() === "dizimo")
  }, [receitas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.membro || !formData.valor || !formData.data || !formData.formaPagamento) {
     toast.error("Membro, valor, data e forma de pagamento são obrigatórios.")
      return
    }

    try {
      const dizimoData = {
        descricao: `Dízimo - ${formData.membro}${formData.observacoes ? ` (${formData.observacoes})` : ""}`,
        categoria: "dizimo",
        valor: Number.parseFloat(formData.valor),
        data: formData.data,
        formaPagamento: formData.formaPagamento,
        membro: formData.membro,
        observacoes: formData.observacoes,
      }

      if (editingId) {
        await updateReceita(editingId, dizimoData)
        toast.success("Dízimo atualizado com sucesso.")
      } else {
        //@ts-ignore
        await addReceita(dizimoData)
        toast.success("Dízimo registrado com sucesso.")

      }

      setFormData({
        descricao: "",
        valor: "",
        data: getTodayDateString(),
        membro: "",
        formaPagamento: "",
        observacoes: "",
      })
      setEditingId(null)
      setOpen(false)
    } catch (error) {
      console.error("Erro ao salvar dízimo:", error)
      toast.error("Erro ao salvar dízimo.")
    }
  }

  const handleEdit = (dizimo: any) => {
    const membro = dizimo.membro || dizimo.descricao.replace("Dízimo - ", "").split(" (")[0]
    const observacoes = dizimo.observacoes || ""

    setFormData({
      descricao: dizimo.descricao,
      valor: dizimo.valor.toString(),
      data: dizimo.data,
      membro: membro,
      formaPagamento: dizimo.formaPagamento || "pix",
      observacoes: observacoes,
    })
    setEditingId(dizimo.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este dízimo?")) {
      try {
        await deleteReceita(id)
        toast.success("Dízimo excluído com sucesso.")

      } catch (error) {
        console.error("Erro ao excluir dízimo:", error)
        toast.error("Erro ao excluir dízimo.")

      }
    }
  }

  // Funções para gerenciar formas de pagamento personalizadas
  const handleAddOrUpdatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPaymentMethodName.trim()) {
      toast.error("O nome da forma de pagamento não pode ser vazio.")
      return
    }
    try {
      if (editingPaymentMethod) {
        await updateCustomPaymentMethod(editingPaymentMethod.id, newPaymentMethodName)
        toast.success("Forma de pagamento atualizada com sucesso!")
      } else {
        await addCustomPaymentMethod(newPaymentMethodName)
        toast.success("Forma de pagamento adicionada com sucesso!")
      }
      setNewPaymentMethodName("")
      setEditingPaymentMethod(null)
    } catch (error) {
      toast.error("Erro ao salvar forma de pagamento.")
    }
  }

  const handleEditPaymentMethod = (method: { id: string; name: string }) => {
    setNewPaymentMethodName(method.name)
    setEditingPaymentMethod(method)
  }

  const handleDeletePaymentMethod = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta forma de pagamento?")) {
      try {
        await deleteCustomPaymentMethod(id)
        toast.success("Forma de pagamento excluída com sucesso!")
      } catch (error) {
        toast.error("Erro ao excluir forma de pagamento.")
      }
    }
  }


  const filteredDizimos = dizimos.filter((dizimo) => {
    const matchesSearch = dizimo.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMonth = monthFilter === "all" || new Date(dizimo.data).getMonth() === Number.parseInt(monthFilter)
    const matchesPayment = paymentFilter === "all" || (dizimo.formaPagamento || "pix") === paymentFilter
    return matchesSearch && matchesMonth && matchesPayment
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

    // Corrigido: Extrair membros únicos corretamente
    const membrosUnicos = new Set(
      dizimos.map((dizimo) => {
        if (dizimo.membro) {
          return dizimo.membro
        }
        // Fallback para dados antigos
        const descricaoLimpa = dizimo.descricao.replace("Dízimo - ", "")
        const membroExtraido = descricaoLimpa.split(" (")[0]
        return membroExtraido
      }),
    ).size

    // Estatísticas por forma de pagamento
    const porFormaPagamento = dizimos.reduce(
      (acc, dizimo) => {
        const forma = dizimo.formaPagamento || "pix"
        acc[forma] = (acc[forma] || 0) + dizimo.valor
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalGeral,
      totalMesAtual,
      totalDizimos: dizimos.length,
      membrosContribuintes: membrosUnicos,
      porFormaPagamento,
    }
  }, [dizimos])

  const getPaymentInfo = (formaPagamento: string) => {
    return (
      allPaymentMethods.find((fp) => fp.value === formaPagamento) || {
        value: "outros", // Fallback para formas de pagamento desconhecidas
        label: formaPagamento, // Usa o valor real como label
        icon: Banknote, // Ícone padrão
        color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
        iconColor: "text-gray-600",
      }
    );
  };

  if (loading || customPaymentMethodsLoading) {
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
          <p className="text-muted-foreground">
            Gerencie todos os dízimos da igreja com controle de formas de pagamento
          </p>
        </div>
        <div className="flex gap-2">
          {/* Diálogo para Gerenciar Formas de Pagamento */}
          <Dialog
            open={paymentMethodDialogOpen}
            onOpenChange={(isOpen) => {
              setPaymentMethodDialogOpen(isOpen)
              if (!isOpen) {
                setNewPaymentMethodName("")
                setEditingPaymentMethod(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Formas de Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Gerenciar Formas de Pagamento</DialogTitle>
                <DialogDescription>Adicione, edite ou remova formas de pagamento personalizadas.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddOrUpdatePaymentMethod} className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newPaymentMethodName">Nome da Forma de Pagamento</Label>
                  <Input
                    id="newPaymentMethodName"
                    placeholder="Ex: Boleto, Cheque, etc."
                    value={newPaymentMethodName}
                    onChange={(e) => setNewPaymentMethodName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit">
                  {editingPaymentMethod ? "Atualizar Forma" : "Adicionar Forma"}
                </Button>
              </form>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Formas Existentes</h3>
                {customPaymentMethods.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma forma de pagamento personalizada adicionada.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {customPaymentMethods.map((method) => (
                      <li key={method.id} className="flex items-center justify-between py-2">
                        <span>{method.name}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditPaymentMethod(method)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeletePaymentMethod(method.id)}>
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

          {/* Diálogo para Registrar/Editar Dízimo */}
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen)
              if (isOpen && !editingId) {
                setFormData((prev) => ({ ...prev, data: getTodayDateString() }))
              }
              if (!isOpen) {
                setFormData({
                  descricao: "",
                  valor: "",
                  data: getTodayDateString(),
                  membro: "",
                  formaPagamento: "",
                  observacoes: "",
                })
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
            <DialogContent className="sm:max-w-[500px]">
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
                      Membro *
                    </Label>
                    <Input
                      id="membro"
                      placeholder="Nome do membro"
                      className="col-span-3"
                      value={formData.membro}
                      onChange={(e) => setFormData((prev) => ({ ...prev, membro: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="valor" className="text-right">
                      Valor *
                    </Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="col-span-3"
                      value={formData.valor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, valor: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="data" className="text-right">
                      Data *
                    </Label>
                    <Input
                      id="data"
                      type="date"
                      className="col-span-3"
                      value={formData.data}
                      onChange={(e) => setFormData((prev) => ({ ...prev, data: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="formaPagamento" className="text-right">
                      Forma de Pagamento *
                    </Label>
                    <Select
                      value={formData.formaPagamento}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, formaPagamento: value }))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {allPaymentMethods.map((forma) => {
                          const IconeComponente = forma.icon
                          return (
                            <SelectItem key={forma.value} value={forma.value}>
                              <div className="flex items-center gap-2">
                                <IconeComponente className={`h-4 w-4 ${forma.iconColor}`} />
                                {forma.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="observacoes" className="text-right mt-2">
                      Observações
                    </Label>
                    <Input
                      id="observacoes"
                      placeholder="Observações adicionais (opcional)"
                      className="col-span-3"
                      value={formData.observacoes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
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
      </div>

      {/* Cards de Estatísticas */}
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

      {/* Cards de Formas de Pagamento */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {allPaymentMethods.map((forma) => {
          const valor = stats.porFormaPagamento[forma.value] || 0
          const IconeComponente = forma.icon
          const percentual = stats.totalGeral > 0 ? (valor / stats.totalGeral) * 100 : 0

          return (
            <Card key={forma.value}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{forma.label}</CardTitle>
                <IconeComponente className={`h-4 w-4 ${forma.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">{percentual.toFixed(1)}% do total</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Dízimos</CardTitle>
          <CardDescription>Todos os dízimos registrados no sistema com formas de pagamento</CardDescription>
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
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as formas</SelectItem>
                {allPaymentMethods.map((forma) => {
                  const IconeComponente = forma.icon
                  return (
                    <SelectItem key={forma.value} value={forma.value}>
                      <div className="flex items-center gap-2">
                        <IconeComponente className={`h-4 w-4 ${forma.iconColor}`} />
                        {forma.label}
                      </div>
                    </SelectItem>
                  )
                })}
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
                  <TableHead>Membro</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDizimos.map((dizimo) => {
                  // Corrigido: Usar forma de pagamento com fallback
                  const paymentInfo = getPaymentInfo(dizimo.formaPagamento || "pix")
                  const IconeComponente = paymentInfo.icon

                  // Corrigido: Extrair membro corretamente
                  const membro = dizimo.membro || dizimo.descricao.replace("Dízimo - ", "").split(" (")[0]

                  return (
                    <TableRow key={dizimo.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{membro}</div>
                          {dizimo.observacoes && (
                            <div className="text-xs text-muted-foreground">{dizimo.observacoes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{parseLocalDateString(dizimo.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge className={paymentInfo.color}>
                          <IconeComponente className="h-3 w-3 mr-1" />
                          {paymentInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
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
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
