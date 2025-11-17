import { GoogleGenAI } from "@google/genai";

export async function extractTextFromImage(base64Image: string, mimeType: string): Promise<string> {
  try {
    // API Key is handled by the environment as per guidelines.
    // Initialize the client here to ensure the latest API key from the environment is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [imagePart] },
      config: {
        systemInstruction: "You are an expert OCR (Optical Character Recognition) system. Extract all text from the provided image. Preserve the original line breaks, spacing, and structure with the highest possible accuracy. Do not add any commentary, explanations, or formatting like markdown. Return only the raw, extracted text.",
      }
    });

    return response.text ?? ""; // Return empty string if text is null/undefined

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Let the caller handle the UI error display with a generic message.
    throw new Error("Failed to extract text using the AI model.");
  }
}
