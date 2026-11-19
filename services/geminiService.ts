
import { GoogleGenAI } from "@google/genai";
import { Patient, InventoryItem, Appointment } from "../types";

export const getHospitalInsights = async (
  patients: Patient[],
  inventory: InventoryItem[],
  appointments: Appointment[]
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return "AI Insight service is currently unavailable. Please check API configuration.";
    }
    const ai = new GoogleGenAI({ apiKey });
    const dataContext = `
      Current Hospital Data Snapshot:
      Total Patients: ${patients.length}
      Patients Breakdown: ${JSON.stringify(patients.map(p => ({ diagnosis: p.diagnosis, status: p.status })))}
      Low Stock Items: ${JSON.stringify(inventory.filter(i => i.totalStock < 50).map(i => i.name))}
      Upcoming Appointments: ${appointments.length}
    `;

    const prompt = `
      Act as a Senior Hospital Administrator for an Eye Hospital. 
      Analyze the provided data snapshot.
      Provide a concise 3-bullet point executive summary.
      1. Highlight any critical alerts (inventory or patient load).
      2. Suggest an operational improvement based on the diagnosis trends.
      3. Give a brief financial or efficiency tip.
      Keep it professional, direct, and actionable.
      Data: ${dataContext}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No insights available at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Insight service is currently unavailable. Please check API configuration.";
  }
};

export const extractVitalsFromImage = async (imageBase64: string): Promise<any> => {
  try {
    const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
    const prompt = `
            Extract medical vitals from this image. 
            Identify: 
            - Blood Pressure (BP) in mmHg
            - Pulse (Heart Rate) in bpm
            - Temperature (Temp) in F
            - SpO2 in percentage
            - Weight in kg
            Return ONLY a valid JSON object like:
            {"bp": "120/80", "pulse": "72", "temp": "98.6", "spo2": "99", "weight": "70"}
        `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Vitals OCR Error:", e);
    return null;
  }
};

export const analyzeReport = async (reportType: string, data: any): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Analyze this ${reportType} report for an Eye Hospital.
      Identify key trends, anomalies, and areas for growth.
      Data: ${JSON.stringify(data)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "Analysis complete.";
  } catch (error) {
    return "Unable to analyze report.";
  }
}

export const performOCR = async (imageBase64: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Extract all readable text from this document image. 
      If it looks like a medical form or patient ID, try to identify:
      - Name
      - Age
      - Contact Info
      - Diagnosis/Complaint
      Return the data in a clear, structured JSON format.
    `;

    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt }
        ]
      }
    });

    return response.text || "No text could be extracted.";
  } catch (error) {
    console.error("OCR Error:", error);
    return "Error performing OCR on document.";
  }
};
