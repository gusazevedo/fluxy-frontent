"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, initialAuthState } from "@/lib/auth/actions";
import { SubmitButton, TextField, Alert } from "@/components/ui/form";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initialAuthState);

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Confira seu e-mail</h1>
        <Alert variant="success">{state.message}</Alert>
        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Criar conta</h1>
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
          error={state.fieldErrors?.email}
          required
        />
        <TextField
          label="Senha"
          name="password"
          type="password"
          autoComplete="new-password"
          error={state.fieldErrors?.password}
          placeholder="Mínimo 8 caracteres"
          required
        />
        <SubmitButton pendingLabel="Criando…">Criar conta</SubmitButton>
      </form>
      <div className="text-sm">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
          Já tenho conta
        </Link>
      </div>
    </div>
  );
}
