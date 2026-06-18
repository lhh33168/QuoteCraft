import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { LoginHero } from "@/features/auth/components/login-hero";

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginHero />
      <LoginFormCard />
    </AuthShell>
  );
}
