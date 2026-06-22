"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { parseBRLToCents } from "@/lib/money";
import { isDateOnly } from "@/lib/date";
import { toErrorState, type FormState } from "@/lib/forms";
import type {
  Kind,
  Transaction,
  TransactionPage,
  TransactionListQuery,
} from "@/lib/api/types";

/**
 * Server Actions de transações (front-specs/0003 §5, 0005 §3).
 * Valor sempre em centavos inteiros > 0 (RN-Tx-4); o sinal vem do kind.
 */

interface ParsedFields {
  amountCents?: number;
  kind?: Kind;
  categoryId?: string;
  occurredAt?: string;
  description?: string | null;
  fieldErrors: Record<string, string>;
}

function parseFields(formData: FormData, partial: boolean): ParsedFields {
  const fieldErrors: Record<string, string> = {};
  const out: ParsedFields = { fieldErrors };

  const amountRaw = formData.get("amount");
  if (amountRaw !== null && String(amountRaw).trim() !== "") {
    const cents = parseBRLToCents(String(amountRaw));
    if (cents === null || cents <= 0) {
      fieldErrors.amount = "Informe um valor maior que zero.";
    } else {
      out.amountCents = cents;
    }
  } else if (!partial) {
    fieldErrors.amount = "Informe o valor.";
  }

  const kind = String(formData.get("kind") ?? "");
  if (kind === "expense" || kind === "income") {
    out.kind = kind;
  } else if (!partial) {
    fieldErrors.kind = "Selecione o tipo.";
  }

  const categoryId = String(formData.get("categoryId") ?? "");
  if (categoryId) {
    out.categoryId = categoryId;
  } else if (!partial) {
    fieldErrors.categoryId = "Selecione uma categoria.";
  }

  const occurredAt = String(formData.get("occurredAt") ?? "");
  if (occurredAt) {
    if (!isDateOnly(occurredAt)) {
      fieldErrors.occurredAt = "Data inválida.";
    } else {
      out.occurredAt = occurredAt;
    }
  } else if (!partial) {
    fieldErrors.occurredAt = "Informe a data.";
  }

  // description: vazio → null (limpa a descrição — RN-Tx-6).
  const description = formData.get("description");
  if (description !== null) {
    const text = String(description).trim();
    if (text.length > 280) {
      fieldErrors.description = "Máximo de 280 caracteres.";
    } else {
      out.description = text === "" ? null : text;
    }
  }

  return out;
}

export async function createTransactionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const f = parseFields(formData, false);
  if (Object.keys(f.fieldErrors).length) {
    return { status: "error", fieldErrors: f.fieldErrors };
  }

  try {
    await apiFetch<Transaction>("/transactions", {
      method: "POST",
      body: {
        amountCents: f.amountCents,
        kind: f.kind,
        categoryId: f.categoryId,
        occurredAt: f.occurredAt,
        description: f.description ?? undefined,
      },
    });
  } catch (error) {
    return toErrorState(error);
  }
  revalidatePath("/transactions");
  redirect("/transactions");
}

export async function updateTransactionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Transação inválida." };

  const f = parseFields(formData, false);
  if (Object.keys(f.fieldErrors).length) {
    return { status: "error", fieldErrors: f.fieldErrors };
  }

  try {
    await apiFetch<Transaction>(`/transactions/${id}`, {
      method: "PATCH",
      body: {
        amountCents: f.amountCents,
        kind: f.kind,
        categoryId: f.categoryId,
        occurredAt: f.occurredAt,
        description: f.description, // pode ser null para limpar
      },
    });
  } catch (error) {
    return toErrorState(error);
  }
  revalidatePath("/transactions");
  redirect("/transactions");
}

export async function deleteTransactionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await apiFetch(`/transactions/${id}`, { method: "DELETE" });
  } catch {
    // Absorve erros; a revalidação recarrega o estado real.
  }
  revalidatePath("/transactions");
  redirect("/transactions");
}

/**
 * Carrega a próxima página por cursor (RN-Tx-8). Reenvia a MESMA query +
 * cursor; o chamador para quando `nextCursor` for null.
 */
export async function loadMoreTransactionsAction(
  query: TransactionListQuery,
  cursor: string,
): Promise<TransactionPage> {
  return apiFetch<TransactionPage>("/transactions", {
    query: { ...query, cursor },
  });
}
