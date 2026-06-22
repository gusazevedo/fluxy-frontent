import { isApiError } from "./errors";

/**
 * Mensagens em PT-BR mapeadas por `code` (front-specs/0006 §3.6).
 * A `message` da API é técnica e em inglês; preferimos textos próprios.
 */
const MESSAGES: Record<string, string> = {
  // Genéricos / transversais
  VALIDATION_ERROR: "Verifique os campos destacados e tente novamente.",
  BAD_REQUEST: "Não foi possível processar a requisição.",
  UNAUTHORIZED: "Sua sessão expirou. Entre novamente.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  NOT_FOUND: "Recurso não encontrado.",
  CONFLICT: "Há um conflito com o estado atual dos dados.",
  INTERNAL_SERVER_ERROR: "Algo deu errado. Tente novamente em instantes.",
  RATE_LIMITED: "Muitas tentativas. Aguarde um momento e tente de novo.",
  NETWORK_ERROR:
    "Não foi possível conectar ao servidor. Verifique se a API está no ar e tente novamente.",

  // Autenticação
  INVALID_CREDENTIALS: "E-mail ou senha incorretos.",
  EMAIL_NOT_VERIFIED: "Confirme seu e-mail antes de entrar.",
  TOKEN_INVALID: "Link inválido. Solicite um novo.",
  TOKEN_EXPIRED: "Link expirado. Solicite um novo.",

  // Categorias
  CATEGORY_NOT_FOUND: "Categoria não encontrada. Atualize a lista.",
  CATEGORY_NAME_IN_USE: "Já existe uma categoria com esse nome e tipo.",

  // Transações
  TRANSACTION_NOT_FOUND: "Transação não encontrada. Atualize a lista.",
  INVALID_AMOUNT: "Informe um valor maior que zero.",
  CATEGORY_ARCHIVED: "Essa categoria foi arquivada e não pode ser usada.",
  CATEGORY_KIND_MISMATCH:
    "A categoria não corresponde ao tipo da transação (despesa/receita).",
};

const FALLBACK = "Algo deu errado. Tente novamente.";

/** Retorna a mensagem PT-BR para um code conhecido. */
export function messageForCode(code: string): string {
  return MESSAGES[code] ?? FALLBACK;
}

/** Extrai uma mensagem amigável de qualquer erro (ApiError ou não). */
export function messageForError(error: unknown): string {
  if (isApiError(error)) return messageForCode(error.code);
  return FALLBACK;
}
