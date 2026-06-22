/**
 * Datas do Fluxy (front-specs/0002 §4).
 *
 * - `occurredAt`, `from`, `to` → data pura "YYYY-MM-DD" (sem fuso).
 * - `createdAt` → timestamp ISO 8601 (UTC).
 * Não confundir os formatos ao exibir/parsear.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** True se a string está no formato de data pura "YYYY-MM-DD". */
export function isDateOnly(value: string): boolean {
  return DATE_ONLY.test(value);
}

/** Data de hoje como "YYYY-MM-DD" no fuso local. */
export function todayDateOnly(): string {
  return toDateOnly(new Date());
}

/** Converte um Date para "YYYY-MM-DD" usando componentes locais. */
export function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Período default de relatórios = mês corrente (RN-Rep-2). Retorna o primeiro e
 * o último dia do mês atual como datas puras, inclusivas nas duas pontas.
 */
export function currentMonthRange(ref: Date = new Date()): {
  from: string;
  to: string;
} {
  const from = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const to = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { from: toDateOnly(from), to: toDateOnly(to) };
}

/** Exibe uma data pura "YYYY-MM-DD" em pt-BR (ex.: "21/06/2026"). */
export function formatDateOnly(value: string): string {
  if (!isDateOnly(value)) return value;
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

/** Exibe um timestamp ISO (createdAt) em data+hora pt-BR. */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR");
}
