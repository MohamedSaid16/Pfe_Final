import { Router } from "express";
import {
  createAnnonceHandler,
  deleteAnnonceHandler,
  getAllAnnoncesHandler,
  getAnnonceByIdHandler,
  updateAnnonceHandler,
} from "./annonce.controller";
import { optionalAuth, requireAuth, requireRole } from "../../middlewares/auth.middleware";
import upload from "../../middlewares/annonces-upload.middleware";

const router = Router();

// Public list — but if a token is present we use it to scope cible.
router.get("/", optionalAuth, getAllAnnoncesHandler);
router.get("/:id", optionalAuth, getAnnonceByIdHandler);

router.post("/", requireAuth, requireRole(["admin"]), upload.array("files", 10), createAnnonceHandler);
router.put("/:id", requireAuth, requireRole(["admin"]), upload.array("files", 10), updateAnnonceHandler);
router.delete("/:id", requireAuth, requireRole(["admin"]), deleteAnnonceHandler);

export default router;