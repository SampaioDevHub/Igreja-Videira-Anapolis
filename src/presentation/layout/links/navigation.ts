import {
  BarChart3,
  DollarSign,
  FileText,
  Home,
  PiggyBank,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

export const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    badge: null,
  },
  {
    name: "Gestão Financeira ",
    icon: BarChart3,
    children: [
      {
        name: "Receitas",
        href: "/receitas",
        icon: TrendingUp,
      },
      {
        name: "Despesas",
        href: "/despesas",
        icon: TrendingDown,
      },
      {
        name: "Dízimos",
        href: "/dizimos",
        icon: PiggyBank,
      },
      {
        name: "Ofertas",
        href: "/ofertas",
        icon: DollarSign,
      },
    ],
  },
  {
    name: "Gestão de Membros",
    icon: Users,
    children: [
      {
        name: "Membros",
        href: "/membros",
        icon: Users,
      },
      {
        name: "Aniversariantes",
        href: "/aniversariantes",
        icon: Users,
      },
    ],
  },
  
  {
    name: "Relatórios",
    href: "/relatorios",
    icon: FileText,
  },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    badge: null,
  },
];
