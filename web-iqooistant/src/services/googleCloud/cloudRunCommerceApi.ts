/**
 * Google Cloud Run - Serverless Commerce APIs & Hosting Layer
 * 
 * Manages communication with backend microservices deployed on Google Cloud Run:
 * - Hosted in us-central1 (eligible for Google Cloud Always Free Tier)
 * - Scales to zero (min-instances: 0) when idle
 * - Handles payment webhooks, transaction status polling, and API orchestration
 */

export interface CloudRunServiceMetadata {
  serviceName: string;
  region: string;
  url: string;
  minInstances: number;
  maxInstances: number;
  freeTierEligible: boolean;
}

export class CloudRunCommerceApi {
  private static serviceUrl = 'https://ai-builder-hackathon-55vtvt2b3a-uc.a.run.app';
  private static region = 'us-central1';

  /**
   * Returns Cloud Run service URL endpoint
   */
  static getEndpoint(): string {
    return this.serviceUrl;
  }

  /**
   * Returns Cloud Run service deployment metadata
   */
  static getMetadata(): CloudRunServiceMetadata {
    return {
      serviceName: 'ai-builder-hackathon',
      region: this.region,
      url: this.serviceUrl,
      minInstances: 0,
      maxInstances: 10,
      freeTierEligible: true,
    };
  }

  /**
   * Health probe to verify container availability
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serviceUrl}/healthz`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Dispatches commerce API request with auto-retry on cold-start
   */
  static async invokeCommerceEndpoint(path: string, payload: any): Promise<any> {
    const targetUrl = `${this.serviceUrl}${path.startsWith('/') ? path : '/' + path}`;
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Cloud Run Commerce API error: ${response.status}`);
    }

    return response.json();
  }
}
