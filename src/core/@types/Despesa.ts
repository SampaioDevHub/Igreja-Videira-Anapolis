export interface Despesa {
  id: string
  descricao: string
  categoria: string
  valor: number
  data: string
  status: "Pago" | "Pendente" | "Vencido"
  userId: string
  createdAt: Date
}