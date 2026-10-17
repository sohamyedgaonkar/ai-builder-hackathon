/**
 * Google Cloud Vertex AI & Google Gemini Mobile Agent Configuration
 * Powers Android Voice-to-Action, Tool Invocation, and ChromePe UPI Integration
 */

export const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "project-e6ed971c-90bc-426a-893";
export const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";

// Primary Model: Google Gemini 2.5 Flash on Vertex AI
export const VERTEX_AI_MODEL = "gemini-2.5-flash";
export const LLM_MODEL = process.env.LLM_MODEL || "google/gemini-2.5-flash";

// Credentials & Routing
export const VERTEX_AI_KEY = process.env.VERTEX_AI_KEY || process.env.GEMINI_API_KEY || "";
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
export const LLM_PROVIDER = process.env.LLM_PROVIDER || (VERTEX_AI_KEY ? "vertex" : "openrouter");
