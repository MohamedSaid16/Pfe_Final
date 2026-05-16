import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  createAnnounce,
  deleteAnnounce,
  getAnnounceById,
  getAnnounces,
  updateAnnounce,
} from "./announcements.service";
import logger from "../../utils/logger";

const parseOptionalBoolean = (value: unknown): boolean | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
};

type AnnounceAudienceLocal = "guest" | "student" | "teacher" | "admin";

const resolveAudienceFromUser = (req: AuthRequest): AnnounceAudienceLocal => {
  const roles = Array.isArray(req.user?.roles) ? req.user!.roles.map((r) => String(r).toLowerCase()) : [];
  if (!roles.length) return "guest";
  if (roles.some((r) => r === "admin" || r === "administration")) return "admin";
  if (roles.some((r) => r === "enseignant" || r === "teacher")) return "teacher";
  if (roles.some((r) => r === "etudiant" || r === "student")) return "student";
  return "guest";
};

export const getAllAnnoncesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const typeAnnonce = typeof req.query.typeAnnonce === "string" ? req.query.typeAnnonce : undefined;
    const isExpired = parseOptionalBoolean(req.query.isExpired);
    const audience = resolveAudienceFromUser(req as AuthRequest);

    const data = await getAnnounces({ typeAnnonce, isExpired, audience });

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error: unknown) {
    logger.error("Error in getAllAnnoncesHandler", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des annonces",
    });
  }
};

export const getAnnonceByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ success: false, message: "ID invalide" });
      return;
    }

    const data = await getAnnounceById(id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    logger.error("Error in getAnnonceByIdHandler", error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Annonce non trouvée",
    });
  }
};

export const createAnnonceHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const body = req.body ?? {};
    const { titre, contenu, priority, priorite, typeAnnonce, typeId, dateExpiration, cible, visibility } = body;

    const files = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    const normalizedTitle = typeof titre === "string" ? titre.trim() : "";
    const normalizedContent = typeof contenu === "string" ? contenu.trim() : "";

    // Per-field error reporting so the client can highlight the right field
    // instead of showing a single generic "both required" toast.
    const fieldErrors: Record<string, string> = {};
    if (!normalizedTitle)   fieldErrors.titre   = "Title is required";
    if (!normalizedContent) fieldErrors.contenu = "Content is required";

    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({
        success: false,
        message: "Titre et contenu sont obligatoires",
        error: {
          code: "MISSING_FIELDS",
          message: "Titre et contenu sont obligatoires",
          fields: fieldErrors,
        },
      });
      return;
    }

    const data = await createAnnounce(
      {
        titre: normalizedTitle,
        contenu: normalizedContent,
        priority:
          typeof priority === "string"
            ? priority
            : typeof priorite === "string"
            ? priorite
            : undefined,
        typeAnnonce: typeof typeAnnonce === "string" ? typeAnnonce : undefined,
        typeId: typeId !== undefined ? Number(typeId) : undefined,
        dateExpiration: dateExpiration ? new Date(dateExpiration) : undefined,
        cible:
          typeof cible === "string" ? cible :
          typeof visibility === "string" ? visibility : undefined,
      },
      req.user.id,
      files
    );

    res.status(201).json({
      success: true,
      message: "Annonce créée avec succès",
      data,
    });
  } catch (error: unknown) {
    logger.error("Error in createAnnonceHandler", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'annonce",
    });
  }
};

export const updateAnnonceHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "ID invalide",
      });
      return;
    }

    const body = req.body ?? {};
    const { titre, contenu, priority, priorite, typeAnnonce, typeId, dateExpiration, cible, visibility } = body;

    // ✅ MULTI FILES
    const files = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    // ✅ REMOVED DOCUMENT IDS (IMPORTANT)
    const removedDocumentIdsRaw = req.body?.removedDocumentIds;

    const removedDocumentIds = Array.isArray(removedDocumentIdsRaw)
      ? removedDocumentIdsRaw.map(Number).filter(Number.isInteger)
      : removedDocumentIdsRaw
      ? [Number(removedDocumentIdsRaw)].filter(Number.isInteger)
      : [];

    const data = await updateAnnounce(
      id,
      {
        titre: typeof titre === "string" ? titre.trim() : undefined,
        contenu: typeof contenu === "string" ? contenu.trim() : undefined,
        priority:
          typeof priority === "string"
            ? priority
            : typeof priorite === "string"
            ? priorite
            : undefined,
        typeAnnonce: typeof typeAnnonce === "string" ? typeAnnonce : undefined,
        typeId: typeId !== undefined ? Number(typeId) : undefined,
        dateExpiration: dateExpiration ? new Date(dateExpiration) : undefined,
        cible:
          typeof cible === "string" ? cible :
          typeof visibility === "string" ? visibility : undefined,

        // ✅ PASS DELETED IDS
        removedDocumentIds,
      },
      files
    );

    res.status(200).json({
      success: true,
      message: "Annonce mise à jour avec succès",
      data,
    });
  } catch (error: unknown) {
    logger.error("Error in updateAnnonceHandler", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'annonce",
    });
  }
};

export const deleteAnnonceHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "ID invalide",
      });
      return;
    }

    await deleteAnnounce(id);

    res.status(200).json({
      success: true,
      message: "Annonce supprimée avec succès",
    });
  } catch (error: unknown) {
    logger.error("Error in deleteAnnonceHandler", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Delete failed",
    });
  }
};