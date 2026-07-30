import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Gumroad "Ping" sends application/x-www-form-urlencoded POSTs on each sale
// (and again on refund, with refunded=true). Docs: https://gumroad.com/ping
// Relevant fields: license_key, refunded, sale_id, email.
//
// Vercel retries a failing ping hourly for up to 3 hours if we don't return
// 200, so genuine (possibly transient) errors should surface as 500s, while
// "nothing to do" cases (bad secret, no license key) return 200 so Gumroad
// stops retrying them.

function getDb() {
  if (!getApps().length) {
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });
  }
  return getFirestore();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  if (!process.env.GUMROAD_WEBHOOK_SECRET || req.query.secret !== process.env.GUMROAD_WEBHOOK_SECRET) {
    res.status(401).send("Unauthorized");
    return;
  }

  const body = (req.body ?? {}) as Record<string, string | undefined>;
  const licenseKey = body.license_key?.trim();

  if (!licenseKey) {
    // Sale on a product without license keys enabled, or a malformed ping.
    // Nothing we can activate — ack so Gumroad doesn't keep retrying.
    res.status(200).send("ok (no license_key)");
    return;
  }

  const refunded = body.refunded === "true" || (body.refunded as unknown) === true;

  try {
    const db = getDb();
    const ref = db.collection("activationCodes").doc(licenseKey);

    if (refunded) {
      await ref.delete();
      res.status(200).send("ok (refund revoked)");
      return;
    }

    await ref.set(
      {
        used: false,
        source: "gumroad",
        buyerEmail: body.email ?? null,
        saleId: body.sale_id ?? null,
        createdAt: new Date().toISOString()
      },
      { merge: true }
    );

    res.status(200).send("ok (code created)");
  } catch (e) {
    console.error("gumroad-webhook failed", e);
    res.status(500).send("internal error");
  }
}
