/**
 * Constantes de sessão compartilhadas entre o DAL (next/headers) e o proxy.ts.
 * Mantidas em módulo puro (sem next/headers) para poderem ser usadas no proxy.
 */

export const ACCESS_COOKIE = "fluxy_access";
export const REFRESH_COOKIE = "fluxy_refresh";

// Refresh token TTL no backend é 30 dias (front-specs/0004 §1).
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  };
}
