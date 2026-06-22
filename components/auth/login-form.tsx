"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  resendVerificationAction,
  initialAuthState,
} from "@/lib/auth/actions";
import { SubmitButton, TextField, Alert } from "@/components/ui/form";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action] = useActionState(loginAction, initialAuthState);
  const [resendState, resendAction] = useActionState(
    resendVerificationAction,
    initialAuthState,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Entrar</h1>

      {notice ? <Alert variant="success">{notice}</Alert> : null}
      {state.status === "error" && state.message ? (
        <Alert variant="error">{state.message}</Alert>
      ) : null}

      <form action={action} className="space-y-4">
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          required
        />
        <TextField
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
      </form>

      {/* E-mail não verificado: oferecer reenvio (0004 §4.1). */}
      {state.code === "EMAIL_NOT_VERIFIED" ? (
        <form action={resendAction} className="space-y-2">
          <input type="hidden" name="email" value={state.email ?? ""} />
          {resendState.status === "success" ? (
            <Alert variant="success">{resendState.message}</Alert>
          ) : null}
          <button
            type="submit"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Reenviar e-mail de verificação
          </button>
        </form>
      ) : null}

      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-blue-600 hover:underline dark:text-blue-400">
          Esqueci a senha
        </Link>
        <Link href="/register" className="text-blue-600 hover:underline dark:text-blue-400">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
