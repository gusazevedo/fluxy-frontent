import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/constants";
import { isAccessExpired } from "@/lib/auth/jwt";
import type { TokenPair } from "@/lib/api/types";

/**
 * Proxy (antigo Middleware — Next 16). Faz duas coisas para a área autenticada:
 *
 * 1. Proteção de rota: sem sessão ⇒ manda para /login.
 * 2. Refresh PROATIVO: se o access expirou mas há refresh, rotaciona o par
 *    ANTES do render — único lugar (além de actions/route handlers) onde é
 *    permitido escrever cookies. Grava o novo token no request (para o render
 *    atual enxergar) e no response (para o browser). Isso evita 401 no render
 *    de Server Components e mantém a rotação consistente (0004 §2).
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/categories",
  "/transactions",
  "/reports",
  "/account",
];
const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

async function rotateTokens(refreshToken: string): Promise<TokenPair | null> {
  const baseUrl = process.env.API_BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) return null;
  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as TokenPair;
  } catch {
    return null; // erro de rede: trata adiante como sessão indisponível
  }
}

function redirectTo(req: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, req.nextUrl));
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  // Já logado tentando ver telas de auth → manda para a área autenticada.
  if (AUTH_PAGES.includes(pathname) && refresh) {
    return redirectTo(req, "/dashboard");
  }

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  // Rota protegida sem refresh: sessão inexistente.
  if (!refresh) {
    return redirectTo(req, "/login");
  }

  // Access válido: segue direto.
  if (access && !isAccessExpired(access)) {
    return NextResponse.next();
  }

  // Access ausente/expirado: tenta rotacionar antes do render.
  const tokens = await rotateTokens(refresh);
  if (!tokens) {
    // Sessão acabou (ou backend indisponível): desloga e pede login.
    const res = redirectTo(req, "/login");
    res.cookies.delete(ACCESS_COOKIE);
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  // Propaga o novo par: request (render atual) + response (browser).
  const opts = sessionCookieOptions();
  req.cookies.set(ACCESS_COOKIE, tokens.accessToken);
  req.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
  const res = NextResponse.next({ request: req });
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, opts);
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, opts);
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
