"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LoginStatus } from "@/features/auth/components/login-status";
import { EMAIL_OTP_LENGTH } from "@/shared/constants/auth";

type LoginStep = "request-code" | "verify-code";

type CaptchaChallenge = {
  prompt: string;
  token: string;
  expiresInSeconds: number;
};

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
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [step, setStep] = useState<LoginStep>("request-code");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lastSentEmail, setLastSentEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [otpTouched, setOtpTouched] = useState(false);
  const [status, setStatus] = useState<{
    kind: "idle" | "success" | "error";
    message: string | null;
  }>({
    kind: "idle",
    message: callbackError
  });
  const [isPending, startTransition] = useTransition();
  const [isRefreshingCaptcha, startCaptchaTransition] = useTransition();

  const trimmedEmail = email.trim();
  const emailValid = isValidEmail(trimmedEmail);
  const emailInvalid = emailTouched && trimmedEmail.length > 0 && !emailValid;
  const otpInvalid = otpTouched && otpCode.length > 0 && otpCode.length < EMAIL_OTP_LENGTH;
  const otpDigits = Array.from({ length: EMAIL_OTP_LENGTH }, (_, index) => otpCode[index] ?? "");
  const stepProgress = step === "request-code" ? "50%" : "100%";

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

  function loadCaptcha() {
    startCaptchaTransition(async () => {
      try {
        const response = await fetch("/api/auth/captcha", {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          setCaptcha(null);
          setError("登录校验题加载失败，请刷新页面后重试。");
          return;
        }

        const data = (await response.json()) as CaptchaChallenge;
        setCaptcha(data);
        setCaptchaAnswer("");
      } catch {
        setCaptcha(null);
        setError("登录校验题加载失败，请检查网络后重试。");
      }
    });
  }

  useEffect(() => {
    loadCaptcha();
  }, []);

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
      setError("请输入正确的工作邮箱。");
      return;
    }

    if (!captcha) {
      setError("登录校验题还没有准备好，请稍后再试。");
      return;
    }

    if (cooldownSeconds > 0) {
      setError(`请等待 ${cooldownSeconds} 秒后再重新发送验证码。`);
      return;
    }

    startTransition(async () => {
      setStatus({
        kind: "idle",
        message: "正在发送邮箱验证码..."
      });

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: trimmedEmail,
            captchaToken: captcha.token,
            captchaAnswer
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
          loadCaptcha();
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
        message: "正在验证邮箱验证码..."
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
  const sendDisabled =
    isPending ||
    isRefreshingCaptcha ||
    !captcha ||
    captchaAnswer.trim().length === 0 ||
    cooldownSeconds > 0 ||
    trimmedEmail.length === 0 ||
    !emailValid;
  const emailForDisplay = lastSentEmail || trimmedEmail;

  return (
    <section className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-3xl text-ink">邮箱登录</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted">
            输入工作邮箱并完成基础校验后获取验证码，再输入 {EMAIL_OTP_LENGTH} 位数字验证码完成登录。
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:px-4">
          <span>步骤</span>
          <span className="text-sm tracking-normal text-ink">{step === "request-code" ? "1 / 2" : "2 / 2"}</span>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          <span>登录进度</span>
          <span>{step === "request-code" ? "填写邮箱" : "输入验证码"}</span>
        </div>
        <div className="h-2 rounded-full bg-black/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1b5e54] to-[#2f8b71] transition-all duration-300"
            style={{ width: stepProgress }}
          />
        </div>
      </div>

      {step === "request-code" ? (
        <form className="mt-7 space-y-5" onSubmit={handleSendCode}>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted">工作邮箱</label>
            <input
              autoComplete="email"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 outline-none placeholder:text-muted/70"
              onBlur={() => setEmailTouched(true)}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="请输入常用工作邮箱"
              type="email"
              value={email}
            />
            {emailInvalid ? <p className="text-xs leading-6 text-red-600">请输入正确的邮箱格式，例如 `name@company.com`。</p> : null}
          </div>

          <div className="rounded-3xl border border-black/10 bg-white/70 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">发送前校验</p>
                <p className="mt-2 font-display text-3xl leading-none text-ink sm:text-4xl">{captcha?.prompt ?? "校验题加载中..."}</p>
                <p className="mt-3 text-xs leading-6 text-muted">输入正确的计算结果后，才会发送邮箱验证码。</p>
              </div>
              <button
                className="inline-flex min-h-10 w-full shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink sm:w-auto"
                disabled={isRefreshingCaptcha || isPending}
                onClick={loadCaptcha}
                type="button"
              >
                {isRefreshingCaptcha ? "刷新中..." : "换一题"}
              </button>
            </div>
            <input
              className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-4 outline-none placeholder:text-muted/70"
              inputMode="numeric"
              onChange={(event) => setCaptchaAnswer(event.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="请输入计算结果"
              value={captchaAnswer}
            />
          </div>

          {cooldownSeconds > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
              验证码已发送到 {lastSentEmail || "当前邮箱"}，请等待 {cooldownSeconds} 秒后再重新发送。
            </div>
          ) : null}

          <LoginStatus kind={status.kind} message={status.message} />

          <div className="grid grid-cols-2 gap-3">
            <button
              className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-pine px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-pine/50 sm:px-5"
              disabled={sendDisabled}
              type="submit"
            >
              {sendButtonLabel}
            </button>
            <Link
              className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink sm:px-5"
              href={demoShareHref}
            >
              <span className="sm:hidden">体验示例</span>
              <span className="hidden sm:inline">体验示例项目</span>
            </Link>
          </div>
        </form>
      ) : (
        <form className="mt-7 space-y-5" onSubmit={handleVerifyCode} ref={verifyFormRef}>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">验证码已发送至</p>
            <p className="mt-2 text-base font-semibold text-ink sm:text-lg">{emailForDisplay}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              输入 {EMAIL_OTP_LENGTH} 位数字验证码后会自动尝试登录，也支持直接粘贴完整验证码。
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted">邮箱验证码</label>
            <button
              className="grid w-full grid-cols-4 gap-2 rounded-3xl border border-black/10 bg-white/80 p-3 text-left sm:grid-cols-8 sm:gap-3 sm:p-4"
              onClick={() => otpInputRef.current?.focus()}
              type="button"
            >
              {otpDigits.map((digit, index) => {
                const active = index === otpCode.length && otpCode.length < EMAIL_OTP_LENGTH;
                const filled = Boolean(digit);

                return (
                  <span
                    className={[
                      "flex h-12 items-center justify-center rounded-2xl border text-base font-semibold transition sm:h-14 sm:text-lg",
                      filled ? "border-pine bg-pine/10 text-ink" : "border-black/10 bg-white text-muted",
                      active ? "border-pine shadow-[0_0_0_3px_rgba(34,104,90,0.12)]" : ""
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
            <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm leading-6 text-muted">
              没有收到验证码？请等待 {cooldownSeconds} 秒后再重新发送。
            </div>
          ) : (
            <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm leading-6 text-muted">
              没有收到验证码？你可以返回上一步修改邮箱，或重新发送一封新的验证码邮件。
            </div>
          )}

          <LoginStatus kind={status.kind} message={status.message} />

          <div className="grid grid-cols-2 gap-3">
            <button
              className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-pine px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-pine/50 sm:px-5"
              disabled={isPending || otpCode.length !== EMAIL_OTP_LENGTH}
              type="submit"
            >
              {verifyButtonLabel}
            </button>
            <button
              className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink sm:px-5"
              disabled={isPending}
              onClick={handleBackToRequest}
              type="button"
            >
              <span className="sm:hidden">修改 / 重发</span>
              <span className="hidden sm:inline">修改邮箱 / 重发</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
