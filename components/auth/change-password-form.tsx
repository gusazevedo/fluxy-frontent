"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/form-state";
import { SubmitButton, TextField, Alert } from "@/components/ui/form";

export function ChangePasswordForm() {
  const [state, action] = useActionState(
    changePasswordAction,
    initialAuthState,
  );

  return (
    <div className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Trocar senha</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Por segurança, todas as sessões serão encerradas e você precisará entrar
        novamente.
      </p>
      {state.status === "error" && state.message ? (
        <Alert variant="error">{state.message}</Alert>
      ) : null}
      <form action={action} className="space-y-4">
        <TextField
          label="Senha atual"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          error={state.fieldErrors?.currentPassword}
          required
        />
        <TextField
          label="Nova senha"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          error={state.fieldErrors?.newPassword}
          placeholder="Mínimo 8 caracteres"
          required
        />
        <SubmitButton pendingLabel="Salvando…">Trocar senha</SubmitButton>
      </form>
    </div>
  );
}
