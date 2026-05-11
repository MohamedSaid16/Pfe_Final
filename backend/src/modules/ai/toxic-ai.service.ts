import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import logger from "../../utils/logger";

const AI_URL = "http://localhost:8001";

/**
 * Sends text to the AI microservice for toxicity analysis.
 */
export const analyzeText = async (text: string) => {
  try {
    const form = new FormData();
    form.append("text", text);

    const response = await axios.post(`${AI_URL}/analyze/text`, form, {
      headers: form.getHeaders(),
    });

    return response.data;
  } catch (error: any) {
    logger.error(`AI Service (Text) Error: ${error.message}`);
    throw new Error(error.response?.data?.detail || "AI Service failure for text analysis");
  }
};

/**
 * Sends an image file to the AI microservice for moderation.
 */
export const analyzeImage = async (filePath: string) => {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const response = await axios.post(`${AI_URL}/analyze/image`, form, {
      headers: form.getHeaders(),
    });

    return response.data;
  } catch (error: any) {
    logger.error(`AI Service (Image) Error: ${error.message}`);
    throw new Error(error.response?.data?.detail || "AI Service failure for image analysis");
  }
};

/**
 * Sends a PDF file to the AI microservice for toxicity analysis.
 */
export const analyzePDF = async (filePath: string) => {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const response = await axios.post(`${AI_URL}/analyze/pdf`, form, {
      headers: form.getHeaders(),
    });

    return response.data;
  } catch (error: any) {
    logger.error(`AI Service (PDF) Error: ${error.message}`);
    throw new Error(error.response?.data?.detail || "AI Service failure for PDF analysis");
  }
};
