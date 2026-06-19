import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

type CaptchaChallenge = {
  prompt: string;
  token: string;
  expiresInSeconds: number;
};

type CaptchaPayload = {
  answer: string;
  expiresAt: number;
  nonce: string;
};

const CAPTCHA_TTL_SECONDS = 5 * 60;

function getCaptchaSecret() {
  return process.env.AUTH_CAPTCHA_SECRET ?? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "quotecraft-dev-captcha-secret";
}

function signPayload(payload: string) {
  return createHmac("sha256", getCaptchaSecret()).update(payload).digest("base64url");
}

function encodePayload(payload: CaptchaPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as CaptchaPayload;
}

export function createLoginCaptcha(): CaptchaChallenge {
  const left = Math.floor(Math.random() * 8) + 1;
  const right = Math.floor(Math.random() * 8) + 1;
  const useAddition = Math.random() >= 0.5;

  const prompt = useAddition ? `${left} + ${right} = ?` : `${left + right} - ${right} = ?`;
  const answer = useAddition ? String(left + right) : String(left);
  const payload: CaptchaPayload = {
    answer,
    expiresAt: Date.now() + CAPTCHA_TTL_SECONDS * 1000,
    nonce: randomUUID()
  };
  const encodedPayload = encodePayload(payload);
  const signature = signPayload(encodedPayload);

  return {
    prompt,
    token: `${encodedPayload}.${signature}`,
    expiresInSeconds: CAPTCHA_TTL_SECONDS
  };
}

export function verifyLoginCaptcha(token: string, answer: string) {
  const trimmedAnswer = answer.trim();

  if (!token || !trimmedAnswer) {
    return {
      ok: false,
      message: "请先完成发送前的人机校验。"
    };
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return {
      ok: false,
      message: "验证码凭证无效，请刷新后重试。"
    };
  }

  const expectedSignature = signPayload(encodedPayload);

  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return {
      ok: false,
      message: "验证码凭证校验失败，请刷新后重试。"
    };
  }

  let payload: CaptchaPayload;

  try {
    payload = decodePayload(encodedPayload);
  } catch {
    return {
      ok: false,
      message: "验证码数据已损坏，请刷新后重试。"
    };
  }

  if (payload.expiresAt < Date.now()) {
    return {
      ok: false,
      message: "验证码已过期，请刷新后重试。"
    };
  }

  if (payload.answer !== trimmedAnswer) {
    return {
      ok: false,
      message: "验证码答案不正确，请重新输入。"
    };
  }

  return {
    ok: true,
    message: null
  };
}
