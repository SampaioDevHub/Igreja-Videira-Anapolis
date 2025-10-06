"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDespesas } from "@/src/core/hooks/use-despesas";
import { useReceitas } from "@/src/core/hooks/use-receitas";
import { Overview } from "@/src/presentation/layout/components/overview";
import { RecentTransactions } from "@/src/presentation/layout/components/recent-transactions";
import { DollarSign, TrendingDown, TrendingUp, Users } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const { receitas, loading: loadingReceitas } = useReceitas();
  const { despesas, loading: loadingDespesas } = useDespesas();
  const { hidden, setHidden } = useHideValues();

  const stats = useMemo(() => {
    const totalReceitas = receitas.reduce(
      (sum, receita) => sum + receita.valor,
      0
    );
    const totalDespesas = despesas.reduce(
      (sum, despesa) => sum + despesa.valor,
      0
    );
    const totalDizimos = receitas
      .filter((receita) => receita.categoria.toLowerCase() === "dizimo")
      .reduce((sum, receita) => sum + receita.valor, 0);

    return {
      totalReceitas,
      totalDespesas,
      totalDizimos,
      saldoLiquido: totalReceitas - totalDespesas,
    };
  }, [receitas, despesas]);

  if (loadingReceitas || loadingDespesas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Hook para gerenciar se os valores estão ocultos ou não
  function useHideValues() {
    const [hidden, setHidden] = useState<boolean>(() => {
      try {
        const stored = localStorage.getItem("hideDizimos");
        return stored ? JSON.parse(stored) : false;
      } catch {
        return false;
      }
    });

    // Atualiza localStorage sempre que mudar
    useEffect(() => {
      try {
        localStorage.setItem("hideDizimos", JSON.stringify(hidden));
      } catch {}
    }, [hidden]);

    return { hidden, setHidden };
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button
          variant="outline"
          className="ml-2 flex items-center gap-2"
          onClick={() => setHidden(!hidden)}
        >
          {hidden ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3-11-7 1.02-2.05 2.63-3.78 4.63-4.92M3 3l18 18"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"
              />
            </svg>
          )}
          {hidden ? "Mostrar" : "Ocultar"} valores
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hidden
              ? "••••••"
              : `R$ ${stats.totalReceitas.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}`}
            <p className="text-xs text-muted-foreground">
              {receitas.length} transações registradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hidden
                ? "••••••"
                : `R$ ${stats.totalDespesas.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {despesas.length} despesas registradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dízimos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hidden
                ? "••••••"
                : `R$ ${stats.totalDizimos.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                receitas.filter((r) => r.categoria.toLowerCase() === "dizimo")
                  .length
              }{" "}
              dízimos registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                stats.saldoLiquido >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
             {hidden
                ? "••••••"
                : `R$ ${stats.saldoLiquido.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`}
            </div>
            <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview receitas={receitas} despesas={despesas} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Suas {receitas.length + despesas.length} transações mais recentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions receitas={receitas} despesas={despesas} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
