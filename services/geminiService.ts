import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a receipt image and extracts transaction details.
 */
export const analyzeReceiptImage = async (base64Image: string): Promise<Partial<Transaction> | null> => {
  try {
    const response = await ai.models.generateContent({
      // Using gemini-3-flash-preview for multimodal analysis and reliable JSON schema support
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity, though png works
              data: base64Image
            }
          },
          {
            text: `Analyze this receipt. Extract the total amount, the merchant name (put in note), the date, and categorize it into one of these: Food, Travel, Rent, Bills, Shopping, Custom. 
            Return JSON with keys: amount (number), category (string), date (ISO string), note (string).`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            date: { type: Type.STRING },
            note: { type: Type.STRING }
          },
          required: ['amount', 'category']
        }
      }
    });

    // Access .text property directly as per latest SDK guidelines
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    return null;
  }
};

/**
 * Generates financial insights based on transaction history.
 */
export const generateFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  try {
    // Summarize data to save tokens
    const summary = transactions.map(t => `${t.date.split('T')[0]}: ${t.type} $${t.amount} (${t.category})`).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a financial advisor. Analyze these recent transactions:
      ${summary}
      
      Provide 3 brief, actionable insights or savings recommendations. 
      Format the response as a simple JSON array of strings.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    // Access .text property directly
    return response.text || "[]";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "[]";
  }
};

/**
 * Categorizes a transaction based on a note or description.
 */
export const suggestCategory = async (note: string, amount: number): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Categorize a transaction described as "${note}" with amount ${amount} into one of: Food, Travel, Rent, Bills, Shopping, Custom. Return only the category name.`
        });
        // Access .text property and trim for safety
        return response.text?.trim() || 'Custom';
    } catch (e) {
        return 'Custom';
    }
}
