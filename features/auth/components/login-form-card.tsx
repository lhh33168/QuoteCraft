"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LoginStatus } from "@/features/auth/components/login-status";
import { EMAIL_OTP_LENGTH } from "@/shared/constants/auth";

type LoginStep = "request-code" | "verify-code";

type LoginApiPayload = {
  error?: string;
  message?: string;
  retryAfterSeconds?: number;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function LoginFormCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/workspace";
  const callbackError = searchParams.get("error");
  const demoShareHref = "/share/share-project-education-site";
  const verifyFormRef = useRef<HTMLFormElement | null>(null);
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<LoginStep>("request-code");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lastSentEmail, setLastSentEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [otpTouched, setOtpTouched] = useState(false);
  const [status, setStatus] = useState<{
    kind: "idle" | "success" | "error";
    message: string | null;
  }>({
    kind: callbackError ? "error" : "idle",
    message: callbackError
  });
  const [isPending, startTransition] = useTransition();

  const trimmedEmail = email.trim();
  const emailValid = isValidEmail(trimmedEmail);
  const emailInvalid = emailTouched && trimmedEmail.length > 0 && !emailValid;
  const otpInvalid = otpTouched && otpCode.length > 0 && otpCode.length < EMAIL_OTP_LENGTH;
  const otpDigits = Array.from({ length: EMAIL_OTP_LENGTH }, (_, index) => otpCode[index] ?? "");
  const stepProgress = step === "request-code" ? "50%" : "100%";
  const emailForDisplay = lastSentEmail || trimmedEmail;

  function setError(message: string) {
    setStatus({
      kind: "error",
      message
    });
  }

  function beginCooldown(seconds: number) {
    setCooldownSeconds(seconds);
  }

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (step !== "verify-code") {
      return;
    }

    otpInputRef.current?.focus();
  }, [step]);

  async function handleSendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailTouched(true);

    if (!emailValid) {
      setError("请输入正确的邮箱地址。");
      return;
    }

    if (cooldownSeconds > 0) {
      setError(`请等待 ${cooldownSeconds} 秒后再重新发送。`);
      return;
    }

    startTransition(async () => {
      setStatus({
        kind: "idle",
        message: "正在发送验证码..."
      });

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: trimmedEmail,
            next
          })
        });

        const data = (await response.json()) as LoginApiPayload;

        if (!response.ok) {
          if (typeof data.retryAfterSeconds === "number" && data.retryAfterSeconds > 0) {
            beginCooldown(data.retryAfterSeconds);
          }

          setStatus({
            kind: "error",
            message: data.error ?? "验证码发送失败，请稍后重试。"
          });
          return;
        }

        if (typeof data.retryAfterSeconds === "number" && data.retryAfterSeconds > 0) {
          beginCooldown(data.retryAfterSeconds);
        }

        setLastSentEmail(trimmedEmail);
        setStep("verify-code");
        setOtpCode("");
        setOtpTouched(false);
        setStatus({
          kind: "success",
          message: data.message ?? `验证码已发送，请前往邮箱查看 ${EMAIL_OTP_LENGTH} 位数字验证码。`
        });
      } catch {
        setStatus({
          kind: "error",
          message: "网络请求失败，请检查本地环境后重试。"
        });
      }
    });
  }

  async function submitVerifyCode() {
    startTransition(async () => {
      setStatus({
        kind: "idle",
        message: "正在校验邮箱验证码..."
      });

      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: lastSentEmail || trimmedEmail,
            token: otpCode,
            next
          })
        });

        const data = (await response.json()) as LoginApiPayload;

        if (!response.ok) {
          setStatus({
            kind: "error",
            message: data.error ?? "验证码校验失败，请稍后重试。"
          });
          return;
        }

        setStatus({
          kind: "success",
          message: data.message ?? "登录成功，正在进入工作台。"
        });
        router.push(next as Route);
        router.refresh();
      } catch {
        setStatus({
          kind: "error",
          message: "网络请求失败，请检查本地环境后重试。"
        });
      }
    });
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOtpTouched(true);

    if (otpCode.length !== EMAIL_OTP_LENGTH) {
      setError(`请输入完整的 ${EMAIL_OTP_LENGTH} 位验证码。`);
      return;
    }

    await submitVerifyCode();
  }

  function handleBackToRequest() {
    setStep("request-code");
    setOtpCode("");
    setOtpTouched(false);
    setStatus({
      kind: "idle",
      message:
        cooldownSeconds > 0
          ? `验证码已发送到 ${lastSentEmail}，请等待 ${cooldownSeconds} 秒后再重新发送。`
          : "你可以修改邮箱，或重新发送一封新的验证码邮件。"
    });
  }

  function handleOtpChange(value: string) {
    setOtpTouched(true);
    setOtpCode(value.replace(/\D/g, "").slice(0, EMAIL_OTP_LENGTH));
  }

  function handleOtpPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, EMAIL_OTP_LENGTH);

    if (!pasted) {
      return;
    }

    event.preventDefault();
    setOtpTouched(true);
    setOtpCode(pasted);
  }

  useEffect(() => {
    if (step !== "verify-code" || otpCode.length !== EMAIL_OTP_LENGTH || isPending) {
      return;
    }

    verifyFormRef.current?.requestSubmit();
  }, [otpCode, step, isPending]);

  const sendButtonLabel = isPending ? "发送中..." : cooldownSeconds > 0 ? `${cooldownSeconds}s 后可重发` : "发送验证码";
  const verifyButtonLabel = isPending ? "验证中..." : "验证并登录";
  const sendDisabled = isPending || cooldownSeconds > 0 || trimmedEmail.length === 0 || !emailValid;

  return (
    <section className="rounded-[30px] border border-white/80 bg-white/92 p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-3xl text-ink">邮箱验证码登录</h2>
        </div>
        <div className="inline-flex items-center gap-3 self-start rounded-full bg-[#f4f7f4] px-3 py-2 ring-1 ring-black/6">
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted ring-1 ring-black/6">
            步骤
          </span>
          <span className="text-sm font-semibold text-ink">{step === "request-code" ? "1 / 2" : "2 / 2"}</span>
        </div>
      </div>

      <div className="mt-6 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          <span>登录进度</span>
          <span>{step === "request-code" ? "填写邮箱" : "输入验证码"}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#edf1ee]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#245d53_0%,#3d8b77_100%)] transition-all duration-300"
            style={{ width: stepProgress }}
          />
        </div>
      </div>

      {step === "request-code" ? (
        <form className="mt-7 space-y-5" onSubmit={handleSendCode}>
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted">邮箱地址</label>
            <div className="rounded-2xl bg-[#f5f7f4] ring-1 ring-black/6 transition duration-200 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-pine/12">
              <input
                autoComplete="email"
                className="w-full bg-transparent px-4 py-3 text-[15px] text-ink outline-none placeholder:text-muted/45"
                onBlur={() => setEmailTouched(true)}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                type="email"
                value={email}
              />
            </div>
            {emailInvalid ? <p className="text-xs leading-6 text-red-600">请输入正确的邮箱格式，例如 `name@company.com`。</p> : null}
          </div>

          <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-900 ring-1 ring-sky-100">
            发送后请前往邮箱查看验证码，再回到当前页面完成登录。
          </div>

          {cooldownSeconds > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
              验证码已发送到 {lastSentEmail || "当前邮箱"}，请等待 {cooldownSeconds} 秒后再重新发送。
            </div>
          ) : null}

          <LoginStatus kind={status.kind} message={status.message} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-[18px] bg-pine px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(36,93,83,0.18)] transition duration-200 disabled:cursor-not-allowed disabled:bg-pine/50 disabled:shadow-none"
              disabled={sendDisabled}
              type="submit"
            >
              {sendButtonLabel}
            </button>
            <Link
              className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-[18px] bg-[#f5f7f4] px-4 text-sm font-semibold text-ink ring-1 ring-black/6 transition duration-200 hover:bg-white"
              href={demoShareHref}
            >
              体验示例项目
            </Link>
          </div>
        </form>
      ) : (
        <form className="mt-7 space-y-5" onSubmit={handleVerifyCode} ref={verifyFormRef}>
          <div className="rounded-2xl bg-[#f6faf7] px-4 py-4 ring-1 ring-emerald-100 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">验证码已发送至</p>
            <p className="mt-2 text-base font-semibold text-ink sm:text-lg">{emailForDisplay}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              输入 {EMAIL_OTP_LENGTH} 位数字验证码后会自动尝试登录，也支持直接粘贴完整验证码。
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted">邮箱验证码</label>
            <button
              className="grid w-full grid-cols-4 gap-2 rounded-2xl bg-[#f5f7f4] p-2 ring-1 ring-black/6 sm:grid-cols-8 sm:gap-2.5 sm:p-2.5"
              onClick={() => otpInputRef.current?.focus()}
              type="button"
            >
              {otpDigits.map((digit, index) => {
                const active = index === otpCode.length && otpCode.length < EMAIL_OTP_LENGTH;
                const filled = Boolean(digit);

                return (
                  <span
                    className={[
                      "flex h-11 items-center justify-center rounded-xl bg-white text-base font-semibold text-ink transition ring-1 sm:h-12",
                      filled ? "bg-emerald-50 ring-pine/18" : "ring-black/6",
                      active ? "ring-[3px] ring-pine/14" : ""
                    ].join(" ")}
                    key={index}
                  >
                    {digit || ""}
                  </span>
                );
              })}
            </button>
            <input
              autoComplete="one-time-code"
              className="sr-only"
              inputMode="numeric"
              maxLength={EMAIL_OTP_LENGTH}
              onBlur={() => setOtpTouched(true)}
              onChange={(event) => handleOtpChange(event.target.value)}
              onPaste={handleOtpPaste}
              placeholder={`输入 ${EMAIL_OTP_LENGTH} 位验证码`}
              ref={otpInputRef}
              value={otpCode}
            />
            {otpInvalid ? <p className="text-xs leading-6 text-red-600">验证码需要为 {EMAIL_OTP_LENGTH} 位数字。</p> : null}
          </div>

          {cooldownSeconds > 0 ? (
            <div className="rounded-2xl bg-black/[0.03] px-4 py-3 text-sm leading-6 text-muted ring-1 ring-black/6">
              还没收到验证码？请等待 {cooldownSeconds} 秒后再重新发送。
            </div>
          ) : (
            <div className="rounded-2xl bg-black/[0.03] px-4 py-3 text-sm leading-6 text-muted ring-1 ring-black/6">
              还没收到验证码？你可以返回上一步修改邮箱，或重新发送一封新的验证码邮件。
            </div>
          )}

          <LoginStatus kind={status.kind} message={status.message} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-[18px] bg-pine px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(36,93,83,0.18)] transition duration-200 disabled:cursor-not-allowed disabled:bg-pine/50 disabled:shadow-none"
              disabled={isPending || otpCode.length !== EMAIL_OTP_LENGTH}
              type="submit"
            >
              {verifyButtonLabel}
            </button>
            <button
              className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-[18px] bg-[#f5f7f4] px-4 text-sm font-semibold text-ink ring-1 ring-black/6 transition duration-200 hover:bg-white"
              disabled={isPending}
              onClick={handleBackToRequest}
              type="button"
            >
              修改邮箱或重发
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
