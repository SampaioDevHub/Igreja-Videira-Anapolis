import { Banknote, CreditCard, QrCode, Smartphone } from "lucide-react";

export const formasPagamento = [
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
