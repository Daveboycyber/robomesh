export type SettlementLock = {
  ok: true;
  intentId: string;
  amount: number;
  memo: string;
  proof: string;
};

export type SettlementResult = { ok: true; error?: never; fulfilled?: boolean; already?: boolean } | { ok: false; error: string };

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json()) as T;
}

export async function lockSettlement(input: {
  taskId: string;
  title: string;
  amount: number;
  awardedAgent: string;
}): Promise<SettlementLock | { ok: false; error: string }> {
  const result = await post<SettlementLock | { ok: false; error: string }>("/api/settlement", input);
  if (!result.ok) return { ok: false, error: result.error || "Could not lock this settlement." };
  return result;
}

export function approvePayment(paymentId: string) {
  return post<SettlementResult>("/api/approve", { paymentId });
}

export function completePayment(paymentId: string, txid: string) {
  return post<SettlementResult>("/api/complete", { paymentId, txid });
}

export function resumePayment(paymentId: string, txid?: string) {
  return post<SettlementResult>("/api/resume", { paymentId, txid });
}
