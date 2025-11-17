
import { GoogleGenAI } from "@google/genai";

export async function extractTextFromImage(base64Image: string, mimeType: string): Promise<string> {
  try {
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
      throw new Error("The Gemini API key is missing. Please configure it in your environment settings.");
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    };

    const textPart = {
      text: "You are an advanced OCR (Optical Character Recognition) system. Extract all text from this image. Preserve the original line breaks and structure as accurately as possible. Do not add any commentary or explanations, only return the extracted text."
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini API returned no text. The image might be empty or unreadable.");
    }
    return text;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
       if (error.message.includes('API key not valid')) {
         throw new Error("The configured Gemini API key is not valid. Please check your environment variables.");
       }
       // Re-throw the original or a more generic error
       throw new Error(error.message || "Failed to extract text using Gemini API.");
    }
    // Fallback for non-Error objects
    throw new Error("An unknown error occurred while contacting the Gemini API.");
  }
}
