import { createHmac, timingSafeEqual } from "node:crypto";

type SendCooldownPayload = {
  email: string;
  expiresAt: number;
};

export type SendCooldownState = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const SEND_COOLDOWN_SECONDS = 60;

function getCooldownSecret() {
  return process.env.AUTH_SEND_COOLDOWN_SECRET ?? process.env.SUPABASE_SECRET_KEY ?? "quotecraft-dev-send-cooldown-secret";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function signPayload(payload: string) {
  return createHmac("sha256", getCooldownSecret()).update(payload).digest("base64url");
}

function encodePayload(payload: SendCooldownPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(token: string) {
  return JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as SendCooldownPayload;
}

export function createSendCooldownToken(email: string) {
  const payload: SendCooldownPayload = {
    email: normalizeEmail(email),
    expiresAt: Date.now() + SEND_COOLDOWN_SECONDS * 1000
  };
  const encodedPayload = encodePayload(payload);
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySendCooldown(token: string | undefined, email: string): SendCooldownState {
  if (!token) {
    return {
      allowed: true,
      retryAfterSeconds: 0
    };
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return {
      allowed: true,
      retryAfterSeconds: 0
    };
  }

  const expectedSignature = signPayload(encodedPayload);
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return {
      allowed: true,
      retryAfterSeconds: 0
    };
  }

  try {
    const payload = decodePayload(encodedPayload);

    if (payload.email !== normalizeEmail(email)) {
      return {
        allowed: true,
        retryAfterSeconds: 0
      };
    }

    const remainingMs = payload.expiresAt - Date.now();

    if (remainingMs <= 0) {
      return {
        allowed: true,
        retryAfterSeconds: 0
      };
    }

    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(remainingMs / 1000)
    };
  } catch {
    return {
      allowed: true,
      retryAfterSeconds: 0
    };
  }
}
