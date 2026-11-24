import crypto from "node:crypto";
import {
  apiKey,
  normalizePiAmount,
  publicError,
  settlementMemo,
  signIntent,
} from "./_lib/payments.mjs";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }
  try {
    if (!apiKey()) throw new Error("PI_NETWORK_API_KEY is not configured on the server.");
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const title = String(body.title || "").trim();
    const awardedAgent = String(body.awardedAgent || "").trim();
    if (!title || title.length > 80) throw new Error("Task title is required.");
    if (!awardedAgent || awardedAgent.length > 40) throw new Error("Awarded agent is required.");
    const amount = normalizePiAmount(body.amount);
    const memo = settlementMemo(title);
    const intentId = crypto.randomUUID();
    const proof = signIntent(intentId, amount, memo);
    res.status(200).json({
      ok: true,
      intentId,
      amount: Number(amount),
      memo,
      proof,
      awardedAgent,
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: publicError(error) });
  }
}
