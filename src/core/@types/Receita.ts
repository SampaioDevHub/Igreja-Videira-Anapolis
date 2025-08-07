export interface Receita {
  tipo: string
  id: string
  descricao: string
  categoria: string
  valor: number
  data: string
  formaPagamento?: string
  observacoes?: string
  membro?: string
  userId: string
  createdAt: Date
}