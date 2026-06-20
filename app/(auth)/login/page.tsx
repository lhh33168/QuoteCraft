import { Suspense } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { LoginFormFallback } from "@/features/auth/components/login-form-fallback";
import { LoginHero } from "@/features/auth/components/login-hero";
import { LoginSessionRedirect } from "@/features/auth/components/login-session-redirect";

export default async function LoginPage() {
  return (
    <AuthShell>
      <LoginSessionRedirect />
      <LoginHero />
      <Suspense fallback={<LoginFormFallback />}>
        <LoginFormCard />
      </Suspense>
    </AuthShell>
  );
}
