import "server-only";

import { apiFetch } from "@/lib/api/client";
import type { Category, Kind } from "@/lib/api/types";

/**
 * Data Access Layer de categorias (todas as rotas 🔒 — front-specs/0003 §4).
 */

export interface ListCategoriesParams {
  kind?: Kind;
  includeArchived?: boolean;
}

/** Lista categorias do usuário. Por padrão, só ativas (RN-Cat-4). */
export async function listCategories(
  params: ListCategoriesParams = {},
): Promise<Category[]> {
  return apiFetch<Category[]>("/categories", {
    query: {
      kind: params.kind,
      includeArchived: params.includeArchived ? "true" : undefined,
    },
  });
}
