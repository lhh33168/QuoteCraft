import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
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
      <Suspense
        fallback={
          <div className="rounded-[30px] border border-white/80 bg-white/85 p-6 text-sm text-muted shadow-soft backdrop-blur sm:p-8">
            正在加载登录表单...
          </div>
        }
      >
        <LoginFormCard />
      </Suspense>
    </AuthShell>
  );
}
