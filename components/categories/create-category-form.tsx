"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCategoryAction } from "@/lib/categories/actions";
import { initialFormState } from "@/lib/forms";
import { SubmitButton, Alert } from "@/components/ui/form";

export function CreateCategoryForm() {
  const [state, action] = useActionState(
    createCategoryAction,
    initialFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o formulário após criar com sucesso.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="font-medium">Nova categoria</h2>
      {state.status === "error" && state.message ? (
        <Alert variant="error">{state.message}</Alert>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            name="name"
            placeholder="Nome (ex.: Mercado)"
            required
            maxLength={60}
            aria-invalid={Boolean(state.fieldErrors?.name)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          {state.fieldErrors?.name ? (
            <span className="mt-1 block text-sm text-red-600 dark:text-red-400">
              {state.fieldErrors.name}
            </span>
          ) : null}
        </div>
        <select
          name="kind"
          defaultValue="expense"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
        <div className="sm:w-32">
          <SubmitButton pendingLabel="Criando…">Criar</SubmitButton>
        </div>
      </div>
    </form>
  );
}
