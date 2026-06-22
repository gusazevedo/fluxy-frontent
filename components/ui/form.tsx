"use client";

import { useFormStatus } from "react-dom";

/** Botão de submit com estado pending automático (useFormStatus). */
export function SubmitButton({
  children,
  pendingLabel,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-foreground px-4 py-2.5 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? (pendingLabel ?? "Enviando…") : children}
    </button>
  );
}

/** Campo de texto com label e erro por campo. */
export function TextField({
  label,
  name,
  type = "text",
  error,
  defaultValue,
  autoComplete,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {error ? (
        <span className="mt-1 block text-sm text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </label>
  );
}

/** Mensagem de feedback (sucesso/erro). */
export function Alert({
  variant,
  children,
}: {
  variant: "success" | "error";
  children: React.ReactNode;
}) {
  const styles =
    variant === "success"
      ? "border-green-300 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
      : "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
  return (
    <div role="alert" className={`rounded-md border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  );
}
