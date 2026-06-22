"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, initialAuthState } from "@/lib/auth/actions";
import { SubmitButton, TextField, Alert } from "@/components/ui/form";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(
    forgotPasswordAction,
    initialAuthState,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Esqueci a senha</h1>
      {state.status === "success" ? (
        <Alert variant="success">{state.message}</Alert>
      ) : (
        <>
          {state.status === "error" && state.message ? (
            <Alert variant="error">{state.message}</Alert>
          ) : null}
          <form action={action} className="space-y-4">
            <TextField
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              error={state.fieldErrors?.email}
              required
            />
            <SubmitButton pendingLabel="Enviando…">
              Enviar link de redefinição
            </SubmitButton>
          </form>
        </>
      )}
      <div className="text-sm">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
