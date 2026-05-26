import { Router } from "express";

const mobileSelfieRoutes = Router();

// In-memory store: sessionId → { selfie: base64 string, createdAt }
const selfieStore = new Map<string, { selfie: string; createdAt: number }>();

// Cleanup expired sessions (>5 min) every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of selfieStore) {
    if (now - val.createdAt > 5 * 60 * 1000) {
      selfieStore.delete(key);
    }
  }
}, 60_000);

/**
 * POST /mobile-selfie/:sessionId
 * Mobile uploads selfie image (base64)
 */
mobileSelfieRoutes.post("/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const { selfie } = req.body;

  if (!sessionId || !selfie) {
    return res.status(400).json({ success: false, message: "Missing sessionId or selfie" });
  }

  // Limit selfie size (~5MB base64)
  if (typeof selfie === "string" && selfie.length > 7_000_000) {
    return res.status(400).json({ success: false, message: "Image too large" });
  }

  selfieStore.set(sessionId, { selfie, createdAt: Date.now() });
  console.log(`[MOBILE-SELFIE] ✅ Selfie received for session ${sessionId.slice(0, 8)}...`);

  return res.json({ success: true, message: "Selfie uploaded successfully" });
});

/**
 * GET /mobile-selfie/:sessionId
 * Desktop polls to check if selfie has been uploaded
 */
mobileSelfieRoutes.get("/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const entry = selfieStore.get(sessionId);

  if (!entry) {
    return res.json({ success: true, data: { ready: false } });
  }

  // Return selfie and delete from store (single use)
  selfieStore.delete(sessionId);
  return res.json({ success: true, data: { ready: true, selfie: entry.selfie } });
});

export default mobileSelfieRoutes;
