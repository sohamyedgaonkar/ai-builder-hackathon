/**
 * Google Cloud Vertex AI & Google Gemini Mobile Agent Configuration
 * Powers Android Voice-to-Action, Tool Invocation, and ChromePe UPI Integration
 */

declare const process: any;
declare const atob: any;
declare const Buffer: any;

export const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "project-e6ed971c-90bc-426a-893";
export const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";

// Primary Model: Google Gemini 2.5 Flash on Vertex AI
export const VERTEX_AI_MODEL = "gemini-2.5-flash";
export const LLM_MODEL = process.env.LLM_MODEL || "google/gemini-2.5-flash";

// Credentials & Routing
export const VERTEX_AI_KEY = process.env.VERTEX_AI_KEY || process.env.GEMINI_API_KEY || "";
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
export const LLM_PROVIDER = process.env.LLM_PROVIDER || (VERTEX_AI_KEY ? "vertex" : "openrouter");

// PayPal REST Sandbox Config
export const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";
export const PAYPAL_SANDBOX_CHECKOUT = "https://www.sandbox.paypal.com/checkoutnow";

function safeB64Decode(str: string): string {
  if (typeof atob !== 'undefined') return atob(str);
  if (typeof Buffer !== 'undefined') return Buffer.from(str, 'base64').toString('utf-8');
  return str;
}

export const getPayPalClientId = (): string => {
  return process.env.PAYPAL_CLIENT_ID || 
    safeB64Decode("QWQ3NXh0NGp0WTlDTlZrRHZhd1lpbmhqNlk3a3BoSVRwOUFDWV9GMWhRcllQaWN5dGVEOHAwdGM4eEgzbXJvLU9fc0dJcnphSlAyTXdwWjE=");
};

export const getPayPalClientSecret = (): string => {
  return process.env.PAYPAL_CLIENT_SECRET || 
    safeB64Decode("RURWdVdTUy0zaXNBSFgyRkFlVXR2ck9JX3dvMWN4eDNJNmNfVnVILWNLRGVVMXNJNG5ObmFMOTBKVGsxVVlCbUlSeXZRaWhLTnRESC1NSEg=");
};
