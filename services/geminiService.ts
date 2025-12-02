import { GoogleGenAI, Type } from "@google/genai";
import { Subscription } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseSubscriptionInput = async (input: string): Promise<Partial<Subscription>> => {
  if (!input.trim()) return {};

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract subscription details from this text: "${input}". 
      If the start date is implied (e.g. "started today"), assume today is ${new Date().toISOString().split('T')[0]}.
      If currency is not specified, infer it or default to INR.
      Category should be one of: Entertainment, Software, Utilities, Health & Fitness, Education, Finance, Other.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the service" },
            price: { type: Type.NUMBER, description: "Cost per cycle" },
            currency: { type: Type.STRING, description: "ISO Currency Code e.g. INR" },
            billingCycle: { type: Type.STRING, enum: ["monthly", "yearly"] },
            category: { type: Type.STRING },
            startDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
            description: { type: Type.STRING, description: "Brief description if available" },
            paymentMethod: { type: Type.STRING, description: "Payment method if mentioned" }
          },
          required: ["name", "price", "billingCycle", "category"],
        },
      },
    });

    const text = response.text;
    if (!text) return {};
    
    return JSON.parse(text) as Partial<Subscription>;
  } catch (error) {
    console.error("Failed to parse subscription with Gemini:", error);
    throw new Error("Could not understand the subscription details. Please try again or enter manually.");
  }
};

export const getSpendingAdvice = async (subscriptions: Subscription[]): Promise<string> => {
  try {
    const subList = subscriptions.map(s => `${s.name} (${s.price} ${s.currency}/${s.billingCycle}) - ${s.category}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze these subscriptions and give me 3 brief, bulleted tips on how to optimize or save money. Be friendly but concise.
      
      Subscriptions:
      ${subList}`,
    });

    return response.text || "No advice generated.";
  } catch (error) {
    console.error("Error getting advice:", error);
    return "Could not generate insights at this time.";
  }
};