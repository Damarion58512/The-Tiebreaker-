import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel in AI Studio.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Helper to retry Gemini requests when encountering transient 503 / overloaded errors
async function generateContentWithRetry(aiClient: GoogleGenAI, params: any, maxRetries = 3): Promise<any> {
  let attempt = 0;
  while (true) {
    try {
      return await aiClient.models.generateContent(params);
    } catch (error: any) {
      attempt++;
      const isTransient = 
        error.status === "UNAVAILABLE" ||
        error.code === 503 ||
        error.status === 503 ||
        (error.message && (
          error.message.includes("503") ||
          error.message.includes("high demand") ||
          error.message.includes("UNAVAILABLE") ||
          error.message.includes("overloaded") ||
          error.message.includes("temporary")
        ));

      if (isTransient && attempt < maxRetries) {
        const delay = attempt * 1500;
        console.warn(`[Gemini API] Request failed with transient error ${error.code || error.status || "503"} (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms... Details:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Schemas for the structured responses
const prosConsSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Descriptive title of the decision being evaluated" },
    description: { type: Type.STRING, description: "Plain summary of what this decision entails" },
    pros: {
      type: Type.ARRAY,
      description: "List of advantages or arguments in favor",
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Short statement of the pro" },
          score: { type: Type.INTEGER, description: "Importance/strength score from 1 to 10 (10 being most important)" },
          explanation: { type: Type.STRING, description: "Detailed reasoning for this pro" }
        },
        required: ["text", "score", "explanation"]
      }
    },
    cons: {
      type: Type.ARRAY,
      description: "List of disadvantages or arguments against",
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Short statement of the con" },
          score: { type: Type.INTEGER, description: "Severity/importance score from 1 to 10 (10 being most severe)" },
          explanation: { type: Type.STRING, description: "Detailed reasoning for this con" }
        },
        required: ["text", "score", "explanation"]
      }
    },
    recommendation: { type: Type.STRING, description: "Direct recommendation: MUST be 'highly_recommend', 'recommend', 'neutral', 'caution', or 'avoid'" },
    verdict: { type: Type.STRING, description: "A high-level verdict paragraph summarizing the balance" },
    tiebreakerAdvice: { type: Type.STRING, description: "Explicit instructions/questions to help break any deadlock or make the final choice" }
  },
  required: ["title", "description", "pros", "cons", "recommendation", "verdict", "tiebreakerAdvice"]
};

const comparisonSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Descriptive title of the comparison" },
    description: { type: Type.STRING, description: "A summary context of this multi-option comparison" },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of options being compared"
    },
    criteria: {
      type: Type.ARRAY,
      description: "List of key comparison criteria (e.g. Cost, Time Commitment, Future Value, Personal Growth, Comfort)",
      items: {
        type: Type.OBJECT,
        properties: {
          criteriaName: { type: Type.STRING, description: "Name of the criteria" },
          weight: { type: Type.INTEGER, description: "Relative weight/importance of this criteria from 1 to 5 (5 is most important)" },
          optionScores: {
            type: Type.ARRAY,
            description: "Scores for each option on this specific criteria",
            items: {
              type: Type.OBJECT,
              properties: {
                optionName: { type: Type.STRING, description: "Name of the option exactly as inputted" },
                score: { type: Type.INTEGER, description: "Score from 1 to 10 for this option on this criteria" },
                detail: { type: Type.STRING, description: "Clarifying explanation of why this option scored this way" }
              },
              required: ["optionName", "score", "detail"]
            }
          }
        },
        required: ["criteriaName", "weight", "optionScores"]
      }
    },
    overallWinner: { type: Type.STRING, description: "The name of the option that represents the highest scored recommendation based on criteria" },
    verdictReasoning: { type: Type.STRING, description: "Detailed breakdown of the rationale behind selecting the overall winner" },
    tiebreakerAdvice: { type: Type.STRING, description: "A specific clinching question or advice to break any hesitation or close score gaps" }
  },
  required: ["title", "description", "options", "criteria", "overallWinner", "verdictReasoning", "tiebreakerAdvice"]
};

const swotSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Descriptive title of the SWOT analysis" },
    description: { type: Type.STRING, description: "Summary context of the venture or strategic decision" },
    strengths: {
      type: Type.ARRAY,
      description: "Internal positive attributes or capabilities",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short label for the strength" },
          description: { type: Type.STRING, description: "Explanation of why this weakness exists and how to play it to advantage" },
          impact: { type: Type.STRING, description: "Impact value: MUST be 'high', 'medium', or 'low'" }
        },
        required: ["title", "description", "impact"]
      }
    },
    weaknesses: {
      type: Type.ARRAY,
      description: "Internal barriers, deficiencies, or areas of struggle",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short label for the weakness" },
          description: { type: Type.STRING, description: "Explanation of this weakness and how it might be shored up or overcome" },
          impact: { type: Type.STRING, description: "Impact value: MUST be 'high', 'medium', or 'low'" }
        },
        required: ["title", "description", "impact"]
      }
    },
    opportunities: {
      type: Type.ARRAY,
      description: "External positive conditions, market forces, or avenues for growth",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short label for the opportunity" },
          description: { type: Type.STRING, description: "Explanation of the opportunity and how the applicant can seize it" },
          impact: { type: Type.STRING, description: "Impact value: MUST be 'high', 'medium', or 'low'" }
        },
        required: ["title", "description", "impact"]
      }
    },
    threats: {
      type: Type.ARRAY,
      description: "External adverse factors, risks, or potential roadblocks",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short label for the threat" },
          description: { type: Type.STRING, description: "Explanation of the risk and tactical ways to play defense or insure against it" },
          impact: { type: Type.STRING, description: "Impact value: MUST be 'high', 'medium', or 'low'" }
        },
        required: ["title", "description", "impact"]
      }
    },
    strategicAdvice: {
      type: Type.OBJECT,
      properties: {
        leverageStrengths: { type: Type.STRING, description: "How to use core Strengths to capitalize on Opportunities" },
        mitigateWeaknesses: { type: Type.STRING, description: "How to improve Weaknesses to safeguard against Threats" },
        tiebreakerAction: { type: Type.STRING, description: "The single primary tiebreaker indicator or next active step that will serve as the launch trigger" }
      },
      required: ["leverageStrengths", "mitigateWeaknesses", "tiebreakerAction"]
    },
    verdict: { type: Type.STRING, description: "Solid, clear recommendation stating whether to pursue this strategic pathway" }
  },
  required: ["title", "description", "strengths", "weaknesses", "opportunities", "threats", "strategicAdvice", "verdict"]
};

// API Endpoint to process decisions via Gemini
app.post("/api/analyze", async (req, res) => {
  try {
    const { decision, type, options, additionalContext } = req.body;
    
    if (!decision || typeof decision !== "string" || decision.trim() === "") {
      return res.status(400).json({ error: "decision statement is required and must be a string." });
    }
    
    const validTypes = ["pros_cons", "comparison", "swot"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Supported types: ${validTypes.join(", ")}` });
    }

    if (type === "comparison" && (!options || !Array.isArray(options) || options.length < 2)) {
      return res.status(400).json({ error: "Comparison requires at least 2 options." });
    }

    const ai = getGeminiClient();
    
    let schemaToUse;
    let systemInstruction = "";
    let promptText = "";

    if (type === "pros_cons") {
      schemaToUse = prosConsSchema;
      systemInstruction = "You are a professional decision-making consultant. Your task is to analyze a binary decision, evaluate realistic pros and cons, and assign quantitative scores (1-10) to each factor to reflect importance. You must output deep, critical, non-obvious factors. Frame the analysis perfectly based on the user's situation and compute weighted final scores to render a strict tie-breaking verdict with direct advice.";
      promptText = `Evaluate the following decision: "${decision}". ${additionalContext ? `Additional context provided: ${additionalContext}` : ""}`;
    } else if (type === "comparison") {
      schemaToUse = comparisonSchema;
      const optsList = options.join(", ");
      systemInstruction = `You are a multi-criteria decision assistant. Analyze and compare the following choices: [${optsList}] for the user's problem: "${decision}". Select highly relevant criteria (such as Cost, Effort, Joy, Risk, Long-term payoff, etc.) and assign weights (1-5) and item scores (1-10) properly. Output clear descriptions explaining why each option scored the way it did, calculate the champion objectively, and devise a robust tiebreaker question.`;
      promptText = `Compare these options: ${optsList} to address this decision: "${decision}". ${additionalContext ? `Additional context: ${additionalContext}` : ""}`;
    } else {
      // swot
      schemaToUse = swotSchema;
      systemInstruction = "You are a strategic management consultant. Perform a deep, actionable SWOT SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis for the user's venture or venture/career planning choice. Offer highly customized answers (internal capabilities vs. external circumstances), provide high/medium/low impact labels, formulate cross-sectional strategic directives, and deliver a definitive verdict coupled with a distinct tiebreaker metric.";
      promptText = `Perform a comprehensive SWOT analysis for the following venture or decision: "${decision}". ${additionalContext ? `Additional context: ${additionalContext}` : ""}`;
    }

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schemaToUse,
        temperature: 0.1, // low temperature to ensure schema compliance and strict focus
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response content generated from Gemini.");
    }

    const parsedData = JSON.parse(textOutput.trim());
    return res.json({ success: true, type, data: parsedData });
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    return res.status(500).json({ error: error.message || "An error occurred during decision analysis." });
  }
});

// Vite Server or Prod static asset server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server bound to 0.0.0.0 and listening on http://localhost:${PORT}`);
  });
}

startServer();
