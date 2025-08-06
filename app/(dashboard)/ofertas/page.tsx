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
import { Plus, Search, Trash2, Edit, Heart, Calendar, TrendingUp, DollarSign, Smartphone, CreditCard, Banknote, QrCode, Settings } from 'lucide-react'
import { useReceitas } from "@/src/core/hooks/use-receitas"
import { useCategories } from "@/src/core/hooks/use-categories" 
import { toast } from "react-toastify"


export default function OfertasPage() {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    descricao: "",
    tipo: "", 
    valor: "",
    data: "",
    observacoes: "",
    formaPagamento: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")

  const { receitas, loading, addReceita, updateReceita, deleteReceita } = useReceitas()

  const [offeringTypeDialogOpen, setOfferingTypeDialogOpen] = useState(false)
  const [newOfferingTypeName, setNewOfferingTypeName] = useState("")
  const [editingOfferingType, setEditingOfferingType] = useState<{ id: string; name: string } | null>(null)
  const { categories: offeringTypes, loading: offeringTypesLoading, addCategory: addOfferingType, updateCategory: updateOfferingType, deleteCategory: deleteOfferingType } = useCategories("ofertaTypes") // Usar o hook genérico com nome da coleção

  const defaultOfferingTypes = [
    "Oferta Culto Domingo",
    "Oferta Culto Quinta",
    "Oferta de Primícias",
    "Oferta Missionária",
    "Oferta Especial",
    "Dízimo",
    "Outros",
  ]
  const allOfferingTypes = useMemo(() => {
    const customNames = offeringTypes.map(type => type.name);
    const combined = [...defaultOfferingTypes, ...customNames];
    return Array.from(new Set(combined));
  }, [defaultOfferingTypes, offeringTypes]);

  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false)
  const [newPaymentMethodName, setNewPaymentMethodName] = useState("")
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<{ id: string; name: string } | null>(null)
  const { categories: customPaymentMethods, loading: customPaymentMethodsLoading, addCategory: addCustomPaymentMethod, updateCategory: updateCustomPaymentMethod, deleteCategory: deleteCustomPaymentMethod } = useCategories("paymentMethods") // Nova coleção para formas de pagamento

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


  
  const ofertas = useMemo(() => {
    return receitas.filter((receita) => receita.categoria.toLowerCase() === "oferta")
  }, [receitas])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descricao || !formData.valor || !formData.data || !formData.formaPagamento) {
      toast.error("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    try {
      const ofertaData = {
        descricao: formData.tipo ? `${formData.tipo} - ${formData.descricao}` : formData.descricao,
        categoria: "oferta", 
        valor: Number.parseFloat(formData.valor),
        data: formData.data,
        formaPagamento: formData.formaPagamento,
        observacoes: formData.observacoes,
      }

      if (editingId) {
        await updateReceita(editingId, ofertaData)
        toast.success("Oferta atualizada com sucesso!")
      } else {
        await addReceita(ofertaData)
        toast.success("Oferta registrada com sucesso!")
      }

      setFormData({
        descricao: "",
        tipo: "",
        valor: "",
        data: "",
        observacoes: "",
        formaPagamento: "",
      })
      setEditingId(null)
      setOpen(false)
    } catch (error) {
      console.error("Erro ao salvar oferta:", error)
      toast.error("Erro ao salvar oferta. Por favor, tente novamente.")
    }
  }

  const handleEdit = (oferta: any) => {
    let extractedTipo = "";
    let extractedDescricao = oferta.descricao;

    for (const tipo of allOfferingTypes) {
      if (oferta.descricao.startsWith(`${tipo} - `)) {
        extractedTipo = tipo;
        extractedDescricao = oferta.descricao.substring(`${tipo} - `.length);
        break;
      }
    }

    setFormData({
      descricao: extractedDescricao,
      tipo: extractedTipo,
      valor: oferta.valor.toString(),
      data: oferta.data,
      observacoes: oferta.observacoes || "",
      formaPagamento: oferta.formaPagamento || "pix",
    })
    setEditingId(oferta.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta oferta?")) {
      try {
        await deleteReceita(id)
        toast.success("Oferta excluída com sucesso!")
      } catch (error) {
        console.error("Erro ao excluir oferta:", error)
        toast.error("Erro ao excluir oferta. Por favor, tente novamente.")
      }
    }
  }

  // Funções para gerenciar tipos de oferta personalizados
  const handleAddOrUpdateOfferingType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOfferingTypeName.trim()) {
      toast.error("O nome do tipo de oferta não pode ser vazio.")
      return
    }
    try {
      if (editingOfferingType) {
        await updateOfferingType(editingOfferingType.id, newOfferingTypeName)
        toast.success("Tipo de oferta atualizado com sucesso!")
      } else {
        await addOfferingType(newOfferingTypeName)
        toast.success("Tipo de oferta adicionado com sucesso!")
      }
      setNewOfferingTypeName("")
      setEditingOfferingType(null)
    } catch (error) {
      toast.error("Erro ao salvar tipo de oferta.")
    }
  }

  const handleEditOfferingType = (type: { id: string; name: string }) => {
    setNewOfferingTypeName(type.name)
    setEditingOfferingType(type)
  }

  const handleDeleteOfferingType = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este tipo de oferta?")) {
      try {
        await deleteOfferingType(id)
        toast.success("Tipo de oferta excluído com sucesso!")
      } catch (error) {
        toast.error("Erro ao excluir tipo de oferta.")
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


  const filteredOfertas = ofertas.filter((oferta) => {
    const matchesSearch = oferta.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    // O filtro de tipo agora verifica se a descrição começa com o tipo selecionado
    const matchesTipo = tipoFilter === "all" || oferta.descricao.toLowerCase().startsWith(`${tipoFilter.toLowerCase()} -`) || oferta.descricao.toLowerCase() === tipoFilter.toLowerCase()
    const matchesPayment = paymentFilter === "all" || (oferta.formaPagamento || "pix") === paymentFilter
    return matchesSearch && matchesTipo && matchesPayment
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

    // Estatísticas por forma de pagamento
    const porFormaPagamento = ofertas.reduce(
      (acc, oferta) => {
        const forma = oferta.formaPagamento || "pix"
        acc[forma] = (acc[forma] || 0) + oferta.valor
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalGeral,
      totalMesAtual,
      totalOfertas: ofertas.length,
      maiorOferta,
      mediaOferta,
      porFormaPagamento,
    }
  }, [ofertas])

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

  if (loading || offeringTypesLoading || customPaymentMethodsLoading) {
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
          <p className="text-muted-foreground">
            Gerencie todas as ofertas da igreja com controle de formas de pagamento
          </p>
        </div>
        <div className="flex gap-2">
          {/* Diálogo para Gerenciar Tipos de Oferta */}
          <Dialog
            open={offeringTypeDialogOpen}
            onOpenChange={(isOpen) => {
              setOfferingTypeDialogOpen(isOpen)
              if (!isOpen) {
                setNewOfferingTypeName("")
                setEditingOfferingType(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Tipos de Oferta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Gerenciar Tipos de Oferta</DialogTitle>
                <DialogDescription>Adicione, edite ou remova tipos de oferta personalizados.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddOrUpdateOfferingType} className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newOfferingTypeName">Nome do Tipo de Oferta</Label>
                  <Input
                    id="newOfferingTypeName"
                    placeholder="Ex: Oferta de Gratidão, Campanha de Missões"
                    value={newOfferingTypeName}
                    onChange={(e) => setNewOfferingTypeName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit">
                  {editingOfferingType ? "Atualizar Tipo" : "Adicionar Tipo"}
                </Button>
              </form>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Tipos Existentes</h3>
                {offeringTypes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum tipo de oferta personalizado adicionado.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {offeringTypes.map((type) => (
                      <li key={type.id} className="flex items-center justify-between py-2">
                        <span>{type.name}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditOfferingType(type)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteOfferingType(type.id)}>
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

          {/* Diálogo para Registrar/Editar Oferta */}
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen)
              if (!isOpen) {
                setFormData({
                  descricao: "",
                  tipo: "",
                  valor: "",
                  data: "",
                  observacoes: "",
                  formaPagamento: "",
                })
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
                        {allOfferingTypes.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="descricao" className="text-right">
                      Descrição *
                    </Label>
                    <Input
                      id="descricao"
                      placeholder="Descrição da oferta"
                      className="col-span-3"
                      value={formData.descricao}
                      onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
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
      </div>

      {/* Cards de Estatísticas */}
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

      {/* Cards de Formas de Pagamento */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {allPaymentMethods.map((forma) => { // Usar allPaymentMethods aqui
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
          <CardTitle>Histórico de Ofertas</CardTitle>
          <CardDescription>Todas as ofertas registradas no sistema com formas de pagamento</CardDescription>
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
                {allOfferingTypes.map((tipo) => (
                  <SelectItem key={tipo} value={tipo.toLowerCase()}>
                    {tipo}
                  </SelectItem>
                ))}
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
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOfertas.map((oferta) => {
                  const paymentInfo = getPaymentInfo(oferta.formaPagamento || "pix")
                  const IconeComponente = paymentInfo.icon

                  return (
                    <TableRow key={oferta.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{oferta.descricao}</div>
                          {oferta.observacoes && (
                            <div className="text-xs text-muted-foreground">{oferta.observacoes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(oferta.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge className={paymentInfo.color}>
                          <IconeComponente className="h-3 w-3 mr-1" />
                          {paymentInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
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
