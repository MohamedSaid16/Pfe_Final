import { Router } from "express";
import toxicRoutes from "./toxic.routes";

const router = Router();

/**
 * AI module entry point.
 * Mounts all AI sub-routes under /api/v1/ai.
 *
 * Current sub-modules:
 *   /toxic  — Toxicity analysis (text, image, PDF)
 */
router.use("/toxic", toxicRoutes);

export default router;
