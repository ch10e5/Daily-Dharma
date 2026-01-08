import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { DharmaWisdom } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const wisdomSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    term: {
      type: Type.STRING,
      description: "The Buddhist concept in English alphabet (e.g., 'Metta', 'Dukkha', 'Sunyata')."
    },
    originalTerm: {
      type: Type.STRING,
      description: "The term in its original language script or standard romanization if different."
    },
    language: {
      type: Type.STRING,
      description: "The origin language, e.g., 'Pali' or 'Sanskrit'."
    },
    translation: {
      type: Type.STRING,
      description: "A short, direct English translation of the word."
    },
    definition: {
      type: Type.STRING,
      description: "A concise definition of what the concept means."
    },
    wisdom: {
      type: Type.STRING,
      description: "A deeper explanation of the Buddhist philosophy behind this concept. About 2-3 sentences."
    },
    application: {
      type: Type.STRING,
      description: "Practical advice on how to apply this wisdom in modern daily life. About 2-3 sentences."
    },
    reflectionPrompt: {
      type: Type.STRING,
      description: "A specific question or small action for the user to ponder or do today."
    },
    affirmation: {
      type: Type.STRING,
      description: "A powerful, short 'I AM' affirmation based on this concept (e.g., 'I am a source of loving-kindness')."
    }
  },
  required: ["term", "originalTerm", "language", "translation", "definition", "wisdom", "application", "reflectionPrompt", "affirmation"]
};

export const fetchDailyWisdom = async (previousTerms: string[] = []): Promise<DharmaWisdom> => {
  try {
    const excludeList = previousTerms.length > 0 ? `Please avoid these previously generated terms: ${previousTerms.join(', ')}.` : '';
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Generate a profound Buddhist philosophical concept for a "Word of the Day" app. It should be a concept from Theravada, Mahayana, Zen, or Tibetan traditions. Focus on concepts that offer psychological insight or ethical guidance. ${excludeList} Ensure the tone is serene, wise, and accessible to laypeople.` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: wisdomSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No content generated");
    }

    return JSON.parse(text) as DharmaWisdom;
  } catch (error) {
    console.error("Error generating wisdom:", error);
    throw error;
  }
};

export const generateReflectiveEcho = async (concept: string, reflection: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `The user is reflecting on the Buddhist concept of "${concept}". User's reflection: "${reflection}" Provide a one-sentence "Dharma Echo"—a short, compassionate, and wise response that validates their feeling and connects it back to the essence of the teaching. The response should be very brief (under 20 words), warm, and supportive. Use a gentle, non-judgmental tone.` }] }],
      config: {
        temperature: 0.8,
      },
    });

    return response.text || "May your reflection bring you closer to peace.";
  } catch (error) {
    console.error("Error generating reflection echo:", error);
    return "Your path is unique and valid. May you find clarity.";
  }
};

export const generateWisdomAudio = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ role: 'user', parts: [{ text: `Speak slowly and serenely like a calm, soothing meditation teacher: ${text}` }] }],
      config: {
        // systemInstruction removed to prevent internal errors on TTS endpoint
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio content generated");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
};