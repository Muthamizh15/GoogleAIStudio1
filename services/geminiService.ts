
import { GoogleGenAI, Type } from "@google/genai";
import { Subscription, CATEGORIES, PAYMENT_TYPES } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseSubscriptionInput = async (input: string): Promise<Partial<Subscription>> => {
  if (!input.trim()) return {};

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract bill or subscription details from this text: "${input}". 
      If the start date is implied (e.g. "started today"), assume today is ${new Date().toISOString().split('T')[0]}.
      If currency is not specified, infer it or default to INR.
      If the cycle involves "28 days", use "every-28-days".
      Category should be one of: ${CATEGORIES.join(', ')}.
      Payment Type should be one of: ${PAYMENT_TYPES.join(', ')}.
      Extract any extra context into 'notes'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the service/bill" },
            price: { type: Type.NUMBER, description: "Cost per cycle" },
            currency: { type: Type.STRING, description: "ISO Currency Code e.g. INR" },
            billingCycle: { 
              type: Type.STRING, 
              enum: ["monthly", "yearly", "quarterly", "half-yearly", "every-28-days"] 
            },
            category: { type: Type.STRING },
            startDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
            paymentType: { type: Type.STRING, description: "Mode of payment" },
            paymentDetails: { type: Type.STRING, description: "Specific card name or bank info" },
            notes: { type: Type.STRING, description: "Any additional notes or descriptions" }
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
    throw new Error("Could not understand the details. Please try again or enter manually.");
  }
};

export const getSpendingAdvice = async (subscriptions: Subscription[]): Promise<string> => {
  try {
    const subList = subscriptions.map(s => `${s.name} (${s.price} ${s.currency}/${s.billingCycle}) - ${s.category}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze these recurring expenses (bills, subscriptions, insurance) and give me 3 brief, actionable tips to optimize cash flow or save money. Be friendly but concise.
      
      Expenses:
      ${subList}`,
    });

    return response.text || "No advice generated.";
  } catch (error) {
    console.error("Error getting advice:", error);
    return "Could not generate insights at this time.";
  }
};
