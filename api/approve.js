import { cleanId, piRequest, publicError, verifyPayment } from "./_lib/payments.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const paymentId = cleanId(body.paymentId, "Payment");
    const payment = await piRequest(`/payments/${encodeURIComponent(paymentId)}`);
    const problem = verifyPayment(payment);
    if (problem) throw new Error(problem);
    if (!payment?.status?.developer_approved) {
      await piRequest(`/payments/${encodeURIComponent(paymentId)}/approve`, { method: "POST" });
    }
    res.status(200).json({ ok: true, status: "approved" });
  } catch (error) {
    res.status(400).json({ ok: false, error: publicError(error) });
  }
}
