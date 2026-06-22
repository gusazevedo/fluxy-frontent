"use client";

import { useState, useTransition } from "react";
import {
  renameCategoryAction,
  deleteCategoryAction,
} from "@/lib/categories/actions";
import { initialFormState } from "@/lib/forms";
import type { Category } from "@/lib/api/types";

export function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleRename(formData: FormData) {
    startTransition(async () => {
      const res = await renameCategoryAction(initialFormState, formData);
      if (res.status === "success") {
        setError(undefined);
        setEditing(false);
      } else {
        setError(res.fieldErrors?.name ?? res.message ?? "Erro ao renomear.");
      }
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      {editing ? (
        <form action={handleRename} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="id" value={category.id} />
          <input
            name="name"
            defaultValue={category.name}
            required
            maxLength={60}
            autoFocus
            className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={isPending}
            className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
          >
            {isPending ? "Salvando…" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(undefined);
              setEditing(false);
            }}
            className="text-sm text-zinc-500 hover:underline"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="font-medium">{category.name}</span>
            {category.archived ? (
              <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                arquivada
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {!category.archived ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Renomear
              </button>
            ) : null}
            <form
              action={deleteCategoryAction}
              onSubmit={(e) => {
                if (
                  !confirm(
                    `Excluir "${category.name}"? Se houver transações, ela será apenas arquivada.`,
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={category.id} />
              <button
                type="submit"
                className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
              >
                Excluir
              </button>
            </form>
          </div>
        </>
      )}
      {error ? (
        <span className="w-full text-sm text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </li>
  );
}
