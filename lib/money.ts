/**
 * Dinheiro em BRL com centavos inteiros (front-specs/0002 §3, RN-Money-1).
 *
 * A API usa centavos inteiros em todos os campos *Cents. Nunca usar ponto
 * flutuante para somar/agregar: trabalhe sempre em centavos inteiros e só
 * formate/parseie nas bordas (exibição e input do usuário).
 */

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata centavos inteiros como BRL. Ex.: 1250 → "R$ 12,50". Aceita negativo. */
export function formatBRL(cents: number): string {
  return brlFormatter.format(cents / 100);
}

/**
 * Converte input do usuário (ex.: "12,50", "R$ 1.234,56", "12.50") em centavos
 * inteiros. Retorna `null` se a entrada não for um valor monetário válido.
 *
 * Não impõe positividade — quem cria transação valida `> 0` (RN-Tx-4).
 */
export function parseBRLToCents(input: string): number | null {
  if (typeof input !== "string") return null;

  // Remove símbolo de moeda, espaços (inclui NBSP) e mantém dígitos/separadores.
  let s = input.trim().replace(/\s| /g, "").replace(/r\$/i, "");
  if (s === "") return null;

  const negative = s.startsWith("-");
  if (negative) s = s.slice(1);

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  // Decide qual é o separador decimal:
  // - "1.234,56" → vírgula decimal, ponto é milhar
  // - "1234.56"  → ponto decimal (sem vírgula)
  // - "1.234"    → ambíguo; tratamos ponto como milhar (padrão pt-BR)
  if (hasComma) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasDot) {
    const parts = s.split(".");
    const lastIsDecimal = parts.length === 2 && parts[1].length <= 2;
    s = lastIsDecimal ? s : parts.join("");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;

  const cents = Math.round(Number(s) * 100);
  if (!Number.isFinite(cents)) return null;
  return negative ? -cents : cents;
}
