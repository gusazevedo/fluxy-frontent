"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api/client";
import type { Category, Kind } from "@/lib/api/types";
import { toErrorState, type FormState } from "@/lib/forms";

/**
 * Server Actions de categorias (front-specs/0003 §4, 0005 §2).
 * Após cada mutação, revalida /categories para refletir o estado real —
 * importante no DELETE, que pode arquivar OU excluir (RN-Cat-3).
 */

function validateName(name: string): string | null {
  const v = name.trim();
  if (v.length < 1) return "Informe um nome.";
  if (v.length > 60) return "O nome deve ter no máximo 60 caracteres.";
  return null;
}

export async function createCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "") as Kind;

  const nameErr = validateName(name);
  if (nameErr) return { status: "error", fieldErrors: { name: nameErr } };
  if (kind !== "expense" && kind !== "income") {
    return { status: "error", fieldErrors: { kind: "Selecione o tipo." } };
  }

  try {
    await apiFetch<Category>("/categories", {
      method: "POST",
      body: { name, kind },
    });
  } catch (error) {
    return toErrorState(error);
  }
  revalidatePath("/categories");
  return { status: "success", message: "Categoria criada." };
}

export async function renameCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { status: "error", message: "Categoria inválida." };

  const nameErr = validateName(name);
  if (nameErr) return { status: "error", fieldErrors: { name: nameErr } };

  try {
    // Só `name` é editável — `kind` é imutável (RN-Cat-1).
    await apiFetch<Category>(`/categories/${id}`, {
      method: "PATCH",
      body: { name },
    });
  } catch (error) {
    return toErrorState(error);
  }
  revalidatePath("/categories");
  return { status: "success", message: "Categoria renomeada." };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await apiFetch(`/categories/${id}`, { method: "DELETE" });
  } catch {
    // Erros (ex.: CATEGORY_NOT_FOUND) são absorvidos; a revalidação abaixo
    // recarrega a lista e o estado real aparece.
  }
  revalidatePath("/categories");
}
