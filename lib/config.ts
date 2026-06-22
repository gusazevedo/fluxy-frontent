import "server-only";

/**
 * Configuração de ambiente — acessível APENAS no servidor (BFF).
 *
 * `API_BASE_URL` é server-only (sem prefixo NEXT_PUBLIC_): o browser nunca
 * fala direto com a API; os Route Handlers / Server Components do Next fazem
 * proxy (front-specs/0001 §2, .env.example).
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Variável de ambiente ausente: ${name}. Defina-a em .env.local (veja .env.example).`,
    );
  }
  return value;
}

/** URL base da API Fluxy. Dev local: http://localhost:3333. */
export function getApiBaseUrl(): string {
  return requireEnv("API_BASE_URL").replace(/\/+$/, "");
}
