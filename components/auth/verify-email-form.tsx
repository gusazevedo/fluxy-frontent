"use client";

import { useActionState } from "react";
import Link from "next/link";
import { verifyEmailAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/form-state";
import { SubmitButton, Alert } from "@/components/ui/form";

export function VerifyEmailForm({ token }: { token?: string }) {
  const [state, action] = useActionState(verifyEmailAction, initialAuthState);

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Verificação de e-mail</h1>
        <Alert variant="error">
          Link inválido ou incompleto. Solicite um novo e-mail de verificação.
        </Alert>
        <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          Voltar ao login
        </Link>
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">E-mail verificado</h1>
        <Alert variant="success">{state.message}</Alert>
        <Link href="/login?reason=verified" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Confirmar e-mail</h1>
      {state.status === "error" && state.message ? (
        <Alert variant="error">{state.message}</Alert>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Clique abaixo para confirmar seu endereço de e-mail.
        </p>
      )}
      <form action={action}>
        <input type="hidden" name="token" value={token} />
        <SubmitButton pendingLabel="Confirmando…">Confirmar e-mail</SubmitButton>
      </form>
    </div>
  );
}
