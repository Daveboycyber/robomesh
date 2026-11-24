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
    if (payment?.status?.developer_completed) {
      res.status(200).json({ ok: true, fulfilled: true });
      return;
    }
    if (!payment?.status?.developer_approved) {
      await piRequest(`/payments/${encodeURIComponent(paymentId)}/approve`, { method: "POST" });
    }
    const txid = body.txid || payment?.transaction?.txid;
    if (!txid) {
      res.status(200).json({ ok: true, fulfilled: false });
      return;
    }
    await piRequest(`/payments/${encodeURIComponent(paymentId)}/complete`, {
      method: "POST",
      body: { txid },
    });
    res.status(200).json({ ok: true, fulfilled: true });
  } catch (error) {
    res.status(400).json({ ok: false, error: publicError(error) });
  }
}
