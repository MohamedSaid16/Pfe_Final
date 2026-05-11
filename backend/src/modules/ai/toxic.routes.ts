import { Router } from "express";
import multer from "multer";
import * as toxicController from "./toxic.controller";

const router = Router();

/**
 * Multer configuration for handling file uploads.
 * Files are temporarily stored in the 'uploads/' directory.
 */
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// POST /api/toxic/text
router.post("/text", toxicController.analyzeTextController);

// POST /api/toxic/image - field name: 'file'
router.post("/image", upload.single("file"), toxicController.analyzeImageController);

// POST /api/toxic/pdf - field name: 'file'
router.post("/pdf", upload.single("file"), toxicController.analyzePDFController);

export default router;
