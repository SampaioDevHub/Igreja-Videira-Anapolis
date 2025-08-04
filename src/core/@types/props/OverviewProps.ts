import { Despesa } from "../Despesa"
import { Receita } from "../Receita"

export interface OverviewProps {
  receitas: Receita[]
  despesas: Despesa[]
}