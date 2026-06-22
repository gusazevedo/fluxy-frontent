import { LoginForm } from "@/components/auth/login-form";

const NOTICES: Record<string, string> = {
  "password-changed": "Senha alterada. Entre novamente.",
  "password-reset": "Senha redefinida. Entre com a nova senha.",
  verified: "E-mail verificado! Você já pode entrar.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return <LoginForm notice={reason ? NOTICES[reason] : undefined} />;
}
