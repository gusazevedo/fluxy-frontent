"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { ApiError, isApiError } from "@/lib/api/errors";
import { messageForError } from "@/lib/api/error-messages";
import type { TokenPair, ValidationDetail } from "@/lib/api/types";
import { setSession, clearSession, getRefreshToken } from "./session";
import { validateEmail, validatePassword } from "./validation";
import type { AuthState } from "./form-state";

/**
 * Server Actions dos fluxos de autenticação (front-specs/0003 §3, 0004 §4).
 * Todas executam no servidor; rotas públicas usam `auth: false`.
 * O estado (`AuthState`/`initialAuthState`) vive em ./form-state.
 */

/** Mapeia `details` de VALIDATION_ERROR (paths tipo "/email") para campos. */
function fieldErrorsFromDetails(
  details: ValidationDetail[] | unknown,
): Record<string, string> | undefined {
  if (!Array.isArray(details)) return undefined;
  const out: Record<string, string> = {};
  for (const d of details) {
    const path = typeof d?.path === "string" ? d.path.replace(/^\//, "") : "";
    if (path && !out[path]) {
      out[path] = d?.message ? String(d.message) : "Valor inválido.";
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function toErrorState(error: unknown, email?: string): AuthState {
  if (isApiError(error)) {
    return {
      status: "error",
      message: messageForError(error),
      code: error.code,
      email,
      fieldErrors:
        error.code === "VALIDATION_ERROR"
          ? fieldErrorsFromDetails(error.details)
          : undefined,
    };
  }
  // redirect() lança NEXT_REDIRECT — relança para o framework tratar.
  throw error;
}

// ── Cadastro & verificação de e-mail (0004 §4.1) ─────────────────────────────

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const fieldErrors: Record<string, string> = {};
  const emailErr = validateEmail(email);
  const passErr = validatePassword(password);
  if (emailErr) fieldErrors.email = emailErr;
  if (passErr) fieldErrors.password = passErr;
  if (Object.keys(fieldErrors).length) {
    return { status: "error", fieldErrors };
  }

  try {
    await apiFetch("/auth/register", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
  } catch (error) {
    return toErrorState(error, email);
  }
  // Resposta genérica (não revela se o e-mail já existe — 0003 RNF-3).
  return {
    status: "success",
    message:
      "Se o e-mail for válido, enviamos um link de verificação. Confira sua caixa de entrada.",
    email,
  };
}

export async function resendVerificationAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const emailErr = validateEmail(email);
  if (emailErr) return { status: "error", fieldErrors: { email: emailErr } };

  try {
    await apiFetch("/auth/verify-email/resend", {
      method: "POST",
      auth: false,
      body: { email },
    });
  } catch (error) {
    return toErrorState(error, email);
  }
  return {
    status: "success",
    message: "Se o e-mail estiver pendente, reenviamos a verificação.",
    email,
  };
}

export async function verifyEmailAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  if (!token) {
    return { status: "error", message: "Link inválido. Solicite um novo." };
  }
  try {
    await apiFetch("/auth/verify-email", {
      method: "POST",
      auth: false,
      body: { token },
    });
  } catch (error) {
    return toErrorState(error);
  }
  return {
    status: "success",
    message: "E-mail verificado! Você já pode entrar.",
  };
}

// ── Login / logout (0004 §4.2 / §4.3) ────────────────────────────────────────

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { status: "error", message: "Informe e-mail e senha." };
  }

  try {
    const tokens = await apiFetch<TokenPair>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    await setSession(tokens);
  } catch (error) {
    return toErrorState(error, email);
  }
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      // Sempre 200, idempotente (0004 §4.3). Ignoramos falhas.
      await apiFetch("/auth/logout", {
        method: "POST",
        auth: false,
        body: { refreshToken },
      });
    } catch {
      // Limpamos a sessão local independentemente da resposta.
    }
  }
  await clearSession();
  redirect("/login");
}

// ── Recuperação de senha (0004 §4.4) ─────────────────────────────────────────

export async function forgotPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const emailErr = validateEmail(email);
  if (emailErr) return { status: "error", fieldErrors: { email: emailErr } };

  try {
    await apiFetch("/auth/forgot-password", {
      method: "POST",
      auth: false,
      body: { email },
    });
  } catch (error) {
    return toErrorState(error, email);
  }
  // Sempre genérico (não revela existência do e-mail — 0004 §4.4).
  return {
    status: "success",
    message:
      "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.",
  };
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!token) {
    return { status: "error", message: "Link inválido. Solicite um novo." };
  }
  const passErr = validatePassword(password);
  if (passErr) return { status: "error", fieldErrors: { password: passErr } };

  try {
    await apiFetch("/auth/reset-password", {
      method: "POST",
      auth: false,
      body: { token, password },
    });
  } catch (error) {
    return toErrorState(error);
  }
  // Revoga todas as sessões; o usuário refaz login (0004 §3).
  return {
    status: "success",
    message: "Senha redefinida! Entre com a nova senha.",
  };
}

// ── Troca de senha autenticada (0004 §4.5) ───────────────────────────────────

export async function changePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  if (!currentPassword) {
    return {
      status: "error",
      fieldErrors: { currentPassword: "Informe a senha atual." },
    };
  }
  const passErr = validatePassword(newPassword);
  if (passErr) return { status: "error", fieldErrors: { newPassword: passErr } };

  try {
    await apiFetch("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
  } catch (error) {
    if (error instanceof ApiError && error.is("INVALID_CREDENTIALS")) {
      return {
        status: "error",
        fieldErrors: { currentPassword: "Senha atual incorreta." },
      };
    }
    return toErrorState(error);
  }
  // Todas as sessões são revogadas; refazer login (0004 §4.5).
  await clearSession();
  redirect("/login?reason=password-changed");
}
