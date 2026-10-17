/**
 * Google Cloud Vertex AI - Core Agentic Brain
 * 
 * Powered by Google Gemini 2.5 Flash on Vertex AI.
 * Handles multi-intent understanding, context retention, function/tool orchestration,
 * and low-latency natural responses for conversational commerce.
 */

import { GOOGLE_CLOUD_PROJECT, VERTEX_AI_LOCATION, VERTEX_AI_MODEL } from '../../config';

export interface VertexModelConfig {
  project: string;
  location: string;
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
}

export interface AgenticToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export class GeminiVertexAgent {
  private static config: VertexModelConfig = {
    project: GOOGLE_CLOUD_PROJECT,
    location: VERTEX_AI_LOCATION,
    model: VERTEX_AI_MODEL,
    temperature: 0.2, // Low temperature for deterministic tool execution
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
  };

  /**
   * Constructs the enterprise Vertex AI prediction endpoint URL
   */
  static getEndpoint(): string {
    return `https://${this.config.location}-aiplatform.googleapis.com/v1/projects/${this.config.project}/locations/${this.config.location}/publishers/google/models/${this.config.model}:generateContent`;
  }

  /**
   * Translates OpenAI/standard function tools into native Google Vertex AI Tool format
   */
  static formatVertexTools(tools: any[]): any {
    return {
      functionDeclarations: tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
    };
  }

  /**
   * Applies Google Cloud Vertex AI enterprise safety guardrails
   */
  static getSafetySettings() {
    return [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ];
  }

  static getModelInfo() {
    return {
      name: 'Google Gemini 2.5 Flash',
      provider: 'Google Cloud Vertex AI',
      project: this.config.project,
      location: this.config.location,
      capabilities: ['Multi-turn Reasoning', 'Function Calling', 'Zero PIN Retention', 'Sub-second Latency'],
    };
  }
}
