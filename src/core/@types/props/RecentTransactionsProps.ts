import { Despesa } from "../Despesa"
import { Receita } from "../Receita"

export interface RecentTransactionsProps {
  receitas: Receita[]
  despesas: Despesa[]
}