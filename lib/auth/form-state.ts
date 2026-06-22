/**
 * Estado dos formulários de auth (usado por `useActionState`).
 * Mantido fora do módulo "use server" (que só pode exportar funções async).
 */
export interface AuthState {
  status: "idle" | "error" | "success";
  message?: string;
  /** Erros por campo (de VALIDATION_ERROR ou validação local). */
  fieldErrors?: Record<string, string>;
  /** Código do erro da API — permite à UI reagir (ex.: oferecer reenvio). */
  code?: string;
  /** Eco do e-mail para fluxos de reenvio. */
  email?: string;
}

export const initialAuthState: AuthState = { status: "idle" };
