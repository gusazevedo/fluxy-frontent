import "server-only";

import { apiFetch } from "@/lib/api/client";
import type { Summary, SummaryQuery } from "@/lib/api/types";

/**
 * Data Access Layer de relatórios (🔒 — front-specs/0003 §6).
 * Agregação é do servidor (RN-Rep-5): nunca somar transações no cliente.
 * Período omitido ⇒ mês corrente (RN-Rep-2).
 */
export async function getSummary(query: SummaryQuery = {}): Promise<Summary> {
  return apiFetch<Summary>("/reports/summary", {
    query: { from: query.from, to: query.to },
  });
}
