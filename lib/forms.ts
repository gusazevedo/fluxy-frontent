import { isApiError } from "@/lib/api/errors";
import { messageForError } from "@/lib/api/error-messages";
import type { ValidationDetail } from "@/lib/api/types";

/**
 * Estado genérico de formulários para `useActionState` (mutações de recursos).
 * Reaproveitado por categorias e transações.
 */
export interface FormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  code?: string;
}

export const initialFormState: FormState = { status: "idle" };

/** Mapeia `details` de VALIDATION_ERROR (paths tipo "/name") para campos. */
export function fieldErrorsFromDetails(
  details: ValidationDetail[] | unknown,
): Record<string, string> | undefined {
  if (!Array.isArray(details)) return undefined;
  const out: Record<string, string> = {};
  for (const d of details) {
    const path = typeof d?.path === "string" ? d.path.replace(/^\//, "") : "";
    if (path && !out[path]) {
      out[path] = d?.message ? String(d.message) : "Valor inválido.";
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Converte um erro (ApiError ou não) em FormState de erro. Relança erros de
 * controle de fluxo (ex.: NEXT_REDIRECT), que não são ApiError.
 */
export function toErrorState(error: unknown): FormState {
  if (isApiError(error)) {
    return {
      status: "error",
      message: messageForError(error),
      code: error.code,
      fieldErrors:
        error.code === "VALIDATION_ERROR"
          ? fieldErrorsFromDetails(error.details)
          : undefined,
    };
  }
  throw error;
}
