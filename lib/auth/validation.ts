/**
 * Validações de UX espelhando o schema do backend (front-specs/0005 §1 /
 * 0004 §6). A validação final é SEMPRE do servidor; aqui antecipamos para
 * dar feedback imediato e evitar requisições óbvias.
 */

// Formato algo@algo.dominio, ≤ 320 chars.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return "Informe o e-mail.";
  if (v.length > 320) return "E-mail muito longo.";
  if (!EMAIL_RE.test(v)) return "E-mail inválido.";
  return null;
}

// Senha 8..200, sem complexidade obrigatória (orientação NIST).
export function validatePassword(password: string): string | null {
  if (!password) return "Informe a senha.";
  if (password.length < 8) return "A senha deve ter ao menos 8 caracteres.";
  if (password.length > 200) return "Senha muito longa.";
  return null;
}
