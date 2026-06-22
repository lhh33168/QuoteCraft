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
    let timer: number | null = null;

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
          window.location.assign("/workspace" as Route);
          return;
        }

        timer = window.setTimeout(() => {
          void checkSession();
        }, 800);
      } catch {
        if (cancelled) {
          return;
        }

        timer = window.setTimeout(() => {
          void checkSession();
        }, 1200);
      }
    }

    void checkSession();

    return () => {
      cancelled = true;

      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [router]);

  return null;
}
