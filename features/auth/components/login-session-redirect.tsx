"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type SessionResponse = {
  ok: boolean;
  auth?: {
    session?: {
      exists?: boolean;
    };
    user?: {
      exists?: boolean;
    };
  };
};

export function LoginSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store"
        });
        const data = (await response.json()) as SessionResponse;

        if (cancelled) {
          return;
        }

        if (data.auth?.session?.exists || data.auth?.user?.exists) {
          router.replace("/workspace" as Route);
        }
      } catch {
        // Ignore session probing failures on login page.
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
