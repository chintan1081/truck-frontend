
import { GoogleGenAI } from "@google/genai";

const insightCache: Record<string, string> = {};
let last429Time: number = 0;
const COOLDOWN_PERIOD = 60000; // 1 minute cooldown on 429

export async function getFinancialInsights(data: any) {
  const cacheKey = JSON.stringify(data);
  if (insightCache[cacheKey]) return insightCache[cacheKey];

  // Circuit breaker: Don't call if we hit a 429 recently
  const now = Date.now();
  if (now - last429Time < COOLDOWN_PERIOD) {
    return "The AI intelligence engine is currently on a scheduled cooldown to prevent rate-limit exhaustion. Detailed financial dashboards are available below for manual review.";
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. AI features disabled.");
    return "The intelligence engine is currently offline (API key missing).";
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze logistics financial data. Provide 3 high-impact executive insights on profitability, fuel efficiency, and accounts receivable aging: ${cacheKey}. Keep it professional and concise.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    const text = response.text || "No insights generated.";
    insightCache[cacheKey] = text;
    return text;
  } catch (error: any) {
    console.error("Gemini Insight Error:", error);
    
    if (error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('429')) {
      last429Time = Date.now();
      return "AI Insight quota reached for this period. To maintain system performance, automated analysis is temporarily paused. Please check back later.";
    }
    
    return "The intelligence engine is currently calibrating. Please refer to the raw data visualizations.";
  }
}

export async function parseDieselBill(base64Image: string) {
  const now = Date.now();
  if (now - last429Time < COOLDOWN_PERIOD) {
    console.warn("Skipping OCR due to rate limit cooldown.");
    return null;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Skipping OCR: GEMINI_API_KEY missing.");
    return null;
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Extract strictly: Petrol Pump Name, Liters, Rate per Liter, Total Amount. Return JSON format only." }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });
    
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error: any) {
    console.error("Gemini OCR Error:", error);
    
    if (error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('429')) {
      last429Time = Date.now();
    }
    return null;
  }
}
