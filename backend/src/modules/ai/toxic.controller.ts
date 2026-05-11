import { Request, Response } from "express";
import * as toxicAIService from "./toxic-ai.service";

/**
 * Controller for text toxicity analysis.
 */
export const analyzeTextController = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Text field is required",
      });
    }

    const result = await toxicAIService.analyzeText(text);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error during text analysis",
    });
  }
};

/**
 * Controller for image moderation analysis.
 */
export const analyzeImageController = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file uploaded",
      });
    }

    const result = await toxicAIService.analyzeImage(req.file.path);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error during image analysis",
    });
  }
};

/**
 * Controller for PDF toxicity analysis.
 */
export const analyzePDFController = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No PDF file uploaded",
      });
    }

    const result = await toxicAIService.analyzePDF(req.file.path);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error during PDF analysis",
    });
  }
};
