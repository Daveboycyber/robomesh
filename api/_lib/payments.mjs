import crypto from "node:crypto";

export const MEMO_PREFIX = "RoboMesh settlement";
const MAX_PI = 10000;

export function apiKey() {
  const value = process.env.PI_NETWORK_API_KEY?.trim();
  return value || null;
}

export function normalizePiAmount(value) {
  const n = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isFinite(n) || n <= 0 || n > MAX_PI) {
    throw new Error("Amount must be a positive Pi value up to 10000.");
  }
  const scaled = Math.round(n * 1e7) / 1e7;
  const fixed = scaled.toFixed(7).replace(/\.?0+$/, "");
  if (!/^\d+(\.\d{1,7})?$/.test(fixed) || Number(fixed) <= 0) {
    throw new Error("Amount must be a positive Pi value up to 10000.");
  }
  return fixed;
}

export function settlementMemo(title) {
  const clean = String(title || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
  if (!clean) throw new Error("Task title is required.");
  return `${MEMO_PREFIX}: ${clean}`.slice(0, 100);
}

export function signIntent(intentId, amount, memo) {
  const key = apiKey();
  if (!key) throw new Error("PI_NETWORK_API_KEY is not configured on the server.");
  return crypto.createHmac("sha256", key).update(`${intentId}|${amount}|${memo}`).digest("hex");
}

export function verifyPayment(payment) {
  if (payment?.status?.cancelled || payment?.status?.user_cancelled) {
    return "This Pi payment was cancelled.";
  }
  const intentId = payment?.metadata?.intentId;
  const proof = payment?.metadata?.proof;
  if (typeof intentId !== "string" || typeof proof !== "string") {
    return "Payment does not match this settlement.";
  }
  let amount;
  try {
    amount = normalizePiAmount(payment.amount);
  } catch {
    return "Payment amount does not match the awarded bid.";
  }
  if (typeof payment.memo !== "string" || !payment.memo.startsWith(MEMO_PREFIX)) {
    return "Payment memo does not match this settlement.";
  }
  const expected = signIntent(intentId, amount, payment.memo);
  const a = Buffer.from(expected);
  const b = Buffer.from(proof);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return "Payment does not match this settlement.";
  }
  return null;
}

export async function piRequest(path, options = {}) {
  const key = apiKey();
  if (!key) throw new Error("PI_NETWORK_API_KEY is not configured on the server.");
  const response = await fetch(`https://api.minepi.com/v2${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Key ${key}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const message = data?.message || data?.error || `Pi request failed (${response.status}).`;
    throw new Error(publicError(new Error(String(message))));
  }
  return data;
}

export function publicError(error) {
  const key = apiKey();
  const message = error instanceof Error ? error.message : "Payment request failed.";
  return key ? message.split(key).join("[redacted]") : message;
}

export function cleanId(value, label) {
  const clean = String(value || "").trim();
  if (!clean || clean.length > 80) throw new Error(`${label} is required.`);
  return clean;
}
