/**
 * Google Cloud Vertex AI & Google Gemini Architecture Configuration
 * Optimized for Google Cloud Run, Vertex AI Agent Runtime, and Google Pay (ChromePe)
 */

// Google Cloud Project & Region settings
export const GOOGLE_CLOUD_PROJECT = (import.meta as any).env?.VITE_GOOGLE_CLOUD_PROJECT || "project-e6ed971c-90bc-426a-893";
export const VERTEX_AI_LOCATION = (import.meta as any).env?.VITE_VERTEX_AI_LOCATION || "us-central1";

// Google Vertex AI & Gemini Model
// Primary foundation model: Google Gemini 2.5 Flash on Vertex AI (sub-second latency & native function calling)
export const VERTEX_AI_MODEL = "gemini-2.5-flash";
export const LLM_MODEL = (import.meta as any).env?.VITE_LLM_MODEL || "google/gemini-2.5-flash";

export function getOpenRouterApiKey(): string {
  if (typeof window !== 'undefined') {
    const runtimeKey = (window as any).__RUNTIME_CONFIG__?.VITE_OPENROUTER_API_KEY;
    if (runtimeKey && runtimeKey !== '${VITE_OPENROUTER_API_KEY}' && runtimeKey.trim() !== '') {
      return runtimeKey.trim();
    }

    const storageKey = localStorage.getItem('VITE_OPENROUTER_API_KEY');
    if (storageKey && storageKey.trim() !== '') {
      return storageKey.trim();
    }
  }

  const envKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
  if (envKey && envKey.trim() !== '') {
    return envKey.trim();
  }

  return '';
}

export function getVertexApiKey(): string {
  if (typeof window !== 'undefined') {
    const runtimeKey = (window as any).__RUNTIME_CONFIG__?.VITE_VERTEX_AI_KEY;
    if (runtimeKey && runtimeKey !== '${VITE_VERTEX_AI_KEY}' && runtimeKey.trim() !== '') {
      return runtimeKey.trim();
    }

    const storageKey = localStorage.getItem('VITE_VERTEX_AI_KEY');
    if (storageKey && storageKey.trim() !== '') {
      return storageKey.trim();
    }
  }

  const envKey = (import.meta as any).env?.VITE_VERTEX_AI_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() !== '') {
    return envKey.trim();
  }

  return '';
}

export const OPENROUTER_API_KEY = getOpenRouterApiKey();
export const VERTEX_AI_KEY = getVertexApiKey();

// Provider configuration: 'vertex' | 'openrouter' | 'local'
export const LLM_PROVIDER = (import.meta as any).env?.VITE_LLM_PROVIDER || (VERTEX_AI_KEY ? "vertex" : "openrouter");
