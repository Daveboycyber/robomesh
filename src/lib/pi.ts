/**
 * Pi Network client helpers (Production / Mainnet).
 */

export type IncompletePayment = {
  identifier: string;
  transaction?: { txid?: string };
};

declare global {
  interface Window {
    Pi?: {
      init: (opts: { version: string; sandbox?: boolean }) => void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: IncompletePayment) => void
      ) => Promise<{
        accessToken: string;
        user: { uid: string; username: string };
      }>;
      createPayment?: (
        paymentData: { amount: number; memo: string; metadata?: Record<string, unknown> },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void;
          onReadyForServerCompletion: (paymentId: string, txid: string) => void;
          onCancel?: (paymentId: string) => void;
          onError?: (error: Error, payment?: unknown) => void;
        }
      ) => void;
    };
  }
}

let initialized = false;

export function initPi(): void {
  if (initialized || typeof window === "undefined" || !window.Pi) return;
  try {
    window.Pi.init({ version: "2.0", sandbox: false });
    initialized = true;
  } catch (e) {
    console.warn("Pi.init failed", e);
  }
}

export async function authenticatePi(
  scopes: string[] = ["username", "payments"],
  onIncomplete?: (payment: IncompletePayment) => void
): Promise<{ username: string; uid: string; accessToken: string } | null> {
  initPi();
  if (!window.Pi) {
    console.warn("Pi SDK not available — open in Pi Browser");
    return null;
  }

  try {
    const auth = await window.Pi.authenticate(scopes, (payment) => {
      onIncomplete?.(payment);
    });
    return {
      username: auth.user.username,
      uid: auth.user.uid,
      accessToken: auth.accessToken,
    };
  } catch (err) {
    console.error("Pi authenticate failed", err);
    return null;
  }
}
