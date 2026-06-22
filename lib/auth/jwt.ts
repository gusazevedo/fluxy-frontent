/**
 * Decodificação leve de JWT (apenas leitura do payload, SEM verificar a
 * assinatura — a validação real é do backend). Módulo puro, usável no proxy.
 */

/** `exp` (epoch em segundos) de um JWT, ou null se ausente/ inválido. */
export function decodeJwtExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** True se o access token expirou (com folga de skew, default 30s). */
export function isAccessExpired(token: string, skewSeconds = 30): boolean {
  const exp = decodeJwtExp(token);
  if (exp === null) return true;
  return Date.now() / 1000 >= exp - skewSeconds;
}
