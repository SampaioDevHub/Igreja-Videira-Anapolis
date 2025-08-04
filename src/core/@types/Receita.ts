export interface Receita {
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