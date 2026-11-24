import { cleanId, piRequest, publicError, verifyPayment } from "./_lib/payments.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const paymentId = cleanId(body.paymentId, "Payment");
    const txid = cleanId(body.txid, "Transaction");
    const payment = await piRequest(`/payments/${encodeURIComponent(paymentId)}`);
    const problem = verifyPayment(payment);
    if (problem) throw new Error(problem);
    const chainTx = payment?.transaction?.txid;
    if (chainTx && chainTx !== txid) throw new Error("Transaction id does not match this payment.");
    if (!payment?.status?.developer_completed) {
      await piRequest(`/payments/${encodeURIComponent(paymentId)}/complete`, {
        method: "POST",
        body: { txid },
      });
    }
    res.status(200).json({ ok: true, fulfilled: true, already: Boolean(payment?.status?.developer_completed) });
  } catch (error) {
    res.status(400).json({ ok: false, error: publicError(error) });
  }
}
