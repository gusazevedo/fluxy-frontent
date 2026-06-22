"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, initialAuthState } from "@/lib/auth/actions";
import { SubmitButton, TextField, Alert } from "@/components/ui/form";

export function ResetPasswordForm({ token }: { token?: string }) {
  const [state, action] = useActionState(resetPasswordAction, initialAuthState);

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <Alert variant="error">
          Link inválido ou incompleto. Solicite um novo na tela &quot;Esqueci a
          senha&quot;.
        </Alert>
        <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Senha redefinida</h1>
        <Alert variant="success">{state.message}</Alert>
        <Link href="/login?reason=password-reset" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Definir nova senha</h1>
      {state.status === "error" && state.message ? (
        <Alert variant="error">{state.message}</Alert>
      ) : null}
      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <TextField
          label="Nova senha"
          name="password"
          type="password"
          autoComplete="new-password"
          error={state.fieldErrors?.password}
          placeholder="Mínimo 8 caracteres"
          required
        />
        <SubmitButton pendingLabel="Salvando…">Redefinir senha</SubmitButton>
      </form>
    </div>
  );
}
