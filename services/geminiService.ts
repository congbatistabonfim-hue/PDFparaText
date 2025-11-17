import { GoogleGenAI } from "@google/genai";

export async function extractTextFromImage(base64Image: string, mimeType: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    };
    
    const textPart = {
      text: "You are an expert OCR (Optical Character Recognition) system. Your task is to extract all text from the provided image with the highest possible accuracy.\n\nInstructions:\n1.  **Analyze Image Quality:** If the image quality is poor (e.g., low contrast, noisy, blurry), mentally apply enhancements like contrast adjustment, binarization, and noise reduction before extraction.\n2.  **Extract Text:** Extract all text content. Preserve original line breaks, spacing, and structure.\n3.  **Output:** Return only the raw, extracted text. Do not add any commentary, explanations, or formatting like markdown."
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [textPart, imagePart] },
    });

    return response.text ?? "";

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const originalMessage = error instanceof Error ? error.message : "An unknown AI error occurred";
    throw new Error(`AI model interaction failed: ${originalMessage}`);
  }
}