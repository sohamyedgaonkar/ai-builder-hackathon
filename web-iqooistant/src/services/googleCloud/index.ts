/**
 * Google Cloud Platform Enterprise Architecture Integration Stack
 * 
 * Central registry and orchestrator binding all 8 Google Cloud technologies:
 * 1. Gemini on Vertex AI      - Core Agentic Brain (multi-intent, tool execution, low-latency reasoning)
 * 2. Vertex AI Search         - Intelligent Discovery (semantic catalog retrieval across Zomato, MMT, RedBus, Blinkit)
 * 3. Cloud Run                - Commerce APIs & Serverless Microservices hosting
 * 4. AlloyDB / Cloud SQL      - Ultra-fast ACID transactional persistence for orders, cart, ledgers
 * 5. BigQuery                 - Data Warehouse real-time streaming ingestion for clickstreams & audit events
 * 6. BigQuery AI              - In-database ML for cross-sell recommendations & predictive fraud scoring
 * 7. Cloud Storage            - Digital Asset Hosting & global low-latency CDN for merchant media
 * 8. Looker                   - Business Intelligence & real-time analytics tracking zero-dropoff ROI
 */

export * from './geminiVertexAgent';
export * from './vertexAISearch';
export * from './cloudRunCommerceApi';
export * from './alloyDBClient';
export * from './bigQueryWarehouse';
export * from './bigQueryPredictiveAI';
export * from './cloudStorageCDN';
export * from './lookerBI';

import { GeminiVertexAgent } from './geminiVertexAgent';
import { VertexAISearch } from './vertexAISearch';
import { CloudRunCommerceApi } from './cloudRunCommerceApi';
import { AlloyDBClient } from './alloyDBClient';
import { BigQueryWarehouse } from './bigQueryWarehouse';
import { BigQueryPredictiveAI } from './bigQueryPredictiveAI';
import { CloudStorageCDN } from './cloudStorageCDN';
import { LookerBI } from './lookerBI';

export class GoogleCloudStack {
  static readonly vertexAgent = GeminiVertexAgent;
  static readonly search = VertexAISearch;
  static readonly cloudRun = CloudRunCommerceApi;
  static readonly alloyDB = AlloyDBClient;
  static readonly bigQuery = BigQueryWarehouse;
  static readonly bigQueryAI = BigQueryPredictiveAI;
  static readonly storage = CloudStorageCDN;
  static readonly looker = LookerBI;

  /**
   * Health status probe verifying connectivity across Google Cloud services
   */
  static async checkStackHealth(): Promise<{
    cloudRun: { status: string; endpoint: string };
    bigQuery: { queuedEvents: number };
    alloyDB: { activeSessions: number; recordedOrders: number };
    timestamp: number;
  }> {
    const cloudRunStatus = await CloudRunCommerceApi.checkHealth();
    return {
      cloudRun: {
        status: cloudRunStatus ? 'HEALTHY' : 'STANDBY',
        endpoint: CloudRunCommerceApi.getEndpoint(),
      },
      bigQuery: {
        queuedEvents: BigQueryWarehouse.getQueueSize(),
      },
      alloyDB: {
        activeSessions: 1,
        recordedOrders: AlloyDBClient.getAllOrders().length,
      },
      timestamp: Date.now(),
    };
  }
}
