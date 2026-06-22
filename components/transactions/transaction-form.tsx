"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createTransactionAction,
  updateTransactionAction,
} from "@/lib/transactions/actions";
import { initialFormState } from "@/lib/forms";
import { SubmitButton, Alert } from "@/components/ui/form";
import { todayDateOnly } from "@/lib/date";
import type { Category, Kind, Transaction } from "@/lib/api/types";

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function TransactionForm({
  categories,
  transaction,
}: {
  categories: Category[];
  transaction?: Transaction;
}) {
  const isEdit = Boolean(transaction);
  const [state, action] = useActionState(
    isEdit ? updateTransactionAction : createTransactionAction,
    initialFormState,
  );

  const [kind, setKind] = useState<Kind>(transaction?.kind ?? "expense");

  // Categorias do tipo selecionado: ativas + a atual (mesmo se arquivada,
  // para não forçar troca de vínculo válido — RN-Tx-3).
  const options = categories.filter(
    (c) =>
      c.kind === kind &&
      (!c.archived || c.id === transaction?.categoryId),
  );

  return (
    <form
      action={action}
      className="max-w-md space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      {isEdit ? <input type="hidden" name="id" value={transaction!.id} /> : null}

      {state.status === "error" && state.message ? (
        <Alert variant="error">{state.message}</Alert>
      ) : null}

      <fieldset className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="kind"
            value="expense"
            checked={kind === "expense"}
            onChange={() => setKind("expense")}
          />
          Despesa
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="kind"
            value="income"
            checked={kind === "income"}
            onChange={() => setKind("income")}
          />
          Receita
        </label>
      </fieldset>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Valor (R$)</span>
        <input
          name="amount"
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={transaction ? centsToInput(transaction.amountCents) : ""}
          required
          aria-invalid={Boolean(state.fieldErrors?.amount)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state.fieldErrors?.amount ? (
          <span className="mt-1 block text-sm text-red-600 dark:text-red-400">
            {state.fieldErrors.amount}
          </span>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Categoria</span>
        <select
          name="categoryId"
          defaultValue={transaction?.categoryId ?? ""}
          required
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            Selecione…
          </option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.archived ? " (arquivada)" : ""}
            </option>
          ))}
        </select>
        {options.length === 0 ? (
          <span className="mt-1 block text-sm text-amber-600 dark:text-amber-400">
            Nenhuma categoria de {kind === "expense" ? "despesa" : "receita"}.
            Crie uma em Categorias.
          </span>
        ) : null}
        {state.fieldErrors?.categoryId ? (
          <span className="mt-1 block text-sm text-red-600 dark:text-red-400">
            {state.fieldErrors.categoryId}
          </span>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Data</span>
        <input
          type="date"
          name="occurredAt"
          defaultValue={transaction?.occurredAt ?? todayDateOnly()}
          required
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state.fieldErrors?.occurredAt ? (
          <span className="mt-1 block text-sm text-red-600 dark:text-red-400">
            {state.fieldErrors.occurredAt}
          </span>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          Descrição (opcional)
        </span>
        <textarea
          name="description"
          rows={2}
          maxLength={280}
          defaultValue={transaction?.description ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state.fieldErrors?.description ? (
          <span className="mt-1 block text-sm text-red-600 dark:text-red-400">
            {state.fieldErrors.description}
          </span>
        ) : null}
      </label>

      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Salvando…">
          {isEdit ? "Salvar alterações" : "Adicionar"}
        </SubmitButton>
        <Link
          href="/transactions"
          className="text-sm text-zinc-500 hover:underline"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
