import type { ApiErrorBody, ApiErrorCode, ValidationDetail } from "./types";

/**
 * Erro normalizado da API Fluxy. O frontend SEMPRE reage pelo `code`
 * (estável), nunca pela `message` (texto livre em inglês) — front-specs/0006.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: ValidationDetail[] | unknown;

  constructor(
    code: string,
    statusCode: number,
    message: string,
    details?: ValidationDetail[] | unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /** True se o code bate com algum dos esperados. */
  is(...codes: ApiErrorCode[]): boolean {
    return codes.includes(this.code as ApiErrorCode);
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** Type guard do envelope de erro da API (0006 §1). */
function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ApiErrorBody).error === "object" &&
    (value as ApiErrorBody).error !== null &&
    typeof (value as ApiErrorBody).error.code === "string"
  );
}

/**
 * Constrói um ApiError a partir de uma resposta HTTP não-2xx, parseando o
 * envelope padrão. Faz fallback sensato para 429/5xx/corpo inesperado.
 */
export async function apiErrorFromResponse(res: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }

  if (isApiErrorBody(body)) {
    const { code, message, details, statusCode } = body.error;
    return new ApiError(code, statusCode ?? res.status, message, details);
  }

  // Rate limit (0003 §1) e 5xx podem não trazer o envelope.
  if (res.status === 429) {
    return new ApiError("RATE_LIMITED", 429, "Muitas requisições.");
  }
  return new ApiError(
    res.status >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST",
    res.status,
    res.statusText || "Erro de requisição.",
  );
}
