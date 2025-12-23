
import { GoogleGenAI, Type } from "@google/genai";
import { PatientRecord, AIInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to delay execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced fetch wrapper with exponential backoff for 429 errors
 */
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota');
      
      if (isRateLimit && i < maxRetries - 1) {
        // Exponential backoff: 3s, 6s, 12s... + jitter
        const waitTime = Math.pow(2, i + 1.5) * 1000 + Math.random() * 1000;
        console.warn(`Gemini API Rate Limit hit. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const getClinicalInsights = async (data: PatientRecord[]): Promise<AIInsight> => {
  const summaryData = data.slice(0, 50).map(p => ({
    doctor: p.doctor,
    diagnosis: p.icd10,
    painStart: p.initialPainScore,
    painEnd: p.dischargePainScore,
    revenue: p.revenue
  }));

  const prompt = `
    As a clinical data scientist, analyze this patient outcome dataset and provide a JSON-formatted clinical summary.
    Focus on the "Initial Pain Score" vs "Discharge Pain Score" effectiveness.
    
    Data snippet:
    ${JSON.stringify(summaryData)}
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              clinicalObservations: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              recommendations: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              }
            },
            required: ["summary", "clinicalObservations", "recommendations"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    const isQuota = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota');
    return {
      summary: isQuota 
        ? "API Quota Exceeded. The free tier of the Gemini API has strict limits on requests per minute." 
        : "Could not generate AI insights at this time due to high traffic.",
      clinicalObservations: [
        isQuota 
          ? "Your current API key has hit its hourly or minute-based quota." 
          : "An unexpected error occurred during medical data synthesis."
      ],
      recommendations: [
        "Wait 60 seconds and try requesting insights again.",
        "Consider using a paid API key for higher volume data analysis.",
        "Check your Google AI Studio dashboard for quota details."
      ]
    };
  }
};

export const fetchIcdDescriptions = async (codes: string[]): Promise<Record<string, string>> => {
  if (codes.length === 0) return {};
  
  const prompt = `Provide the full clinical description for these ICD-10 codes: ${codes.join(', ')}. Return a JSON object where keys are the codes and values are the short descriptions.`;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: codes.reduce((acc, code) => ({
              ...acc,
              [code]: { type: Type.STRING }
            }), {})
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  } catch (error) {
    console.error("Error fetching ICD descriptions:", error);
    return {};
  }
};

export interface PatientNarrative {
  summary: string;
  trend: 'improving' | 'stable' | 'declining' | 'not enough data';
  keyIndicators: string[];
}

export const getPatientClinicalNarrative = async (name: string, visits: PatientRecord[]): Promise<PatientNarrative> => {
  const visitHistory = visits.map(v => ({
    date: v.visitDate,
    diagnosis: v.icd10,
    pain: { in: v.initialPainScore, out: v.dischargePainScore }
  }));

  const prompt = `
    Analyze the medical history of patient "${name}". 
    Provide a professional clinical narrative as a JSON object.
    
    Data:
    ${JSON.stringify(visitHistory)}
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A professional 1-paragraph summary of progress." },
              trend: { 
                type: Type.STRING, 
                enum: ["improving", "stable", "declining", "not enough data"],
                description: "The general clinical trajectory."
              },
              keyIndicators: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "3-4 short key clinical health indicators or milestones."
              }
            },
            required: ["summary", "trend", "keyIndicators"]
          }
        }
      });
      return JSON.parse(response.text || '{}') as PatientNarrative;
    });
  } catch (err: any) {
    console.error("Patient Narrative Error:", err);
    const isQuota = err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('quota');
    return {
      summary: isQuota 
        ? "Clinical summary unavailable: API Quota exceeded for this minute." 
        : "Clinical summary currently unavailable due to traffic limits.",
      trend: "not enough data",
      keyIndicators: ["Review manual records", "Retry in 60 seconds"]
    };
  }
};
