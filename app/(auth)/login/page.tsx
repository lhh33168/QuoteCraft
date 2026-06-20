import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { LoginFormFallback } from "@/features/auth/components/login-form-fallback";
import { LoginHero } from "@/features/auth/components/login-hero";
import { getOptionalUser } from "@/server/auth/get-optional-user";

export default async function LoginPage() {
  const user = await getOptionalUser();

  if (user) {
    redirect("/workspace");
  }

  return (
    <AuthShell>
      <LoginHero />
      <Suspense fallback={<LoginFormFallback />}>
        <LoginFormCard />
      </Suspense>
    </AuthShell>
  );
}
