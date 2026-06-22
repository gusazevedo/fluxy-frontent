import Link from "next/link";
import { getSummary } from "@/lib/reports/data";
import { formatBRL } from "@/lib/money";
import { formatDateOnly } from "@/lib/date";
import { isApiError } from "@/lib/api/errors";
import { messageForError } from "@/lib/api/error-messages";
import { Alert } from "@/components/ui/form";
import type { Summary, SummaryCategory } from "@/lib/api/types";

function TotalCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "income" | "expense" | "balance";
}) {
  const color =
    tone === "income"
      ? "text-green-600 dark:text-green-400"
      : tone === "expense"
        ? "text-red-600 dark:text-red-400"
        : "";
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Breakdown({
  title,
  items,
  totalCents,
}: {
  title: string;
  items: SummaryCategory[];
  totalCents: number;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Sem lançamentos no período.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {items.map((c) => {
            // Percentual é cálculo do cliente (RN-Rep-4).
            const pct =
              totalCents > 0 ? Math.round((c.totalCents / totalCents) * 100) : 0;
            return (
              <li
                key={c.categoryId}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {c.archived ? (
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      arquivada
                    </span>
                  ) : null}
                  <span className="text-sm text-zinc-500">
                    ({c.transactionCount})
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatBRL(c.totalCents)}</div>
                  <div className="text-xs text-zinc-500">{pct}%</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function PeriodFilter({ from, to }: { from?: string; to?: string }) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <label className="text-sm">
        <span className="mb-1 block font-medium">De</span>
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium">Até</span>
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90"
        >
          Aplicar
        </button>
        <Link
          href="/reports"
          className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Mês atual
        </Link>
      </div>
    </form>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;

  let summary: Summary | null = null;
  let errorMessage: string | null = null;
  try {
    summary = await getSummary({ from, to });
  } catch (error) {
    if (isApiError(error) && error.is("VALIDATION_ERROR")) {
      errorMessage = `${messageForError(error)} (verifique se "De" não é depois de "Até").`;
    } else {
      throw error;
    }
  }

  const expenses =
    summary?.byCategory.filter((c) => c.kind === "expense") ?? [];
  const incomes = summary?.byCategory.filter((c) => c.kind === "income") ?? [];
  const balanceNegative = (summary?.totals.balanceCents ?? 0) < 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Relatórios</h1>

      <PeriodFilter from={from} to={to} />

      {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

      {summary ? (
        <>
          <p className="text-sm text-zinc-500">
            Período: {formatDateOnly(summary.period.from)} a{" "}
            {formatDateOnly(summary.period.to)} ·{" "}
            {summary.totals.transactionCount} transações
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <TotalCard
              label="Receitas"
              value={formatBRL(summary.totals.incomeCents)}
              tone="income"
            />
            <TotalCard
              label="Despesas"
              value={formatBRL(summary.totals.expenseCents)}
              tone="expense"
            />
            <TotalCard
              label="Saldo"
              value={formatBRL(summary.totals.balanceCents)}
              tone={balanceNegative ? "expense" : "income"}
            />
          </div>

          <Breakdown
            title="Despesas por categoria"
            items={expenses}
            totalCents={summary.totals.expenseCents}
          />
          <Breakdown
            title="Receitas por categoria"
            items={incomes}
            totalCents={summary.totals.incomeCents}
          />
        </>
      ) : null}
    </div>
  );
}
