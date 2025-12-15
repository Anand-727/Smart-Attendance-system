import { GoogleGenAI, Type } from "@google/genai";
import { RecognitionResult, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We limit reference images to avoid token limits in this demo.
// In a production app, you'd use embeddings/vector search.
const MAX_REFERENCE_CHECK = 5;

export const identifyPerson = async (
  currentFrameBase64: string,
  users: User[]
): Promise<RecognitionResult> => {
  try {
    const activeUsers = users.slice(0, MAX_REFERENCE_CHECK);
    
    // Helper to clean base64 string
    const cleanBase64 = (str: string) => str.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const parts: any[] = [];
    
    // 1. Add Target Image
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanBase64(currentFrameBase64)
      }
    });

    // 2. Add Contextual Prompt
    let prompt = `Analyze the first image (the 'Target'). Compare it against the following ${activeUsers.length} reference images.`;
    
    if (activeUsers.length > 0) {
      prompt += `\nReference Mapping:`;
      activeUsers.forEach((u, index) => {
        prompt += `\n- Reference Image ${index + 1}: ID "${u.id}"`;
      });
    } else {
       prompt += `\nNo reference images provided. Just analyze demographics.`;
    }
    
    parts.push({ text: prompt });

    // 3. Add Reference Images
    activeUsers.forEach((u) => {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64(u.photoBase64)
        }
      });
    });
    
    // 4. Request
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: "You are a biometric security AI. Compare the first image (Target) with subsequent reference images. If a face matches a reference with high confidence (>0.7), return the ID. If no match, set matchFound to false. Always estimate demographics.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchFound: { type: Type.BOOLEAN },
            matchId: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            demographics: {
              type: Type.OBJECT,
              properties: {
                age_range: { type: Type.STRING },
                gender: { type: Type.STRING },
                expression: { type: Type.STRING }
              }
            }
          },
          required: ["matchFound", "confidence"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const result = JSON.parse(resultText) as RecognitionResult;
    return result;

  } catch (error) {
    console.error("Gemini Recognition Error:", error);
    return {
      matchFound: false,
      matchId: null,
      confidence: 0,
    };
  }
};