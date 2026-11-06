/**
 * PayPal Sandbox Payment Service (Mobile / React Native)
 * 
 * Official PayPal REST v2 Sandbox Integration:
 * - Client Credentials Token Generation
 * - v2/checkout/orders Creation with direct approval link
 * - Real-time Status Verification & Order Capture
 */

import { getPayPalClientId, getPayPalClientSecret, PAYPAL_API_BASE } from '../config';

declare const btoa: any;
declare const Buffer: any;

export interface CreatePayPalOrderParams {
  amountInr: number;
  description: string;
  orderReferenceId?: string;
}

export interface PayPalOrderResult {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  approvalUrl: string;
  amountUsd: string;
  amountInr: number;
  statusUrl: string;
}

function safeB64Encode(str: string): string {
  if (typeof btoa !== 'undefined') return btoa(str);
  if (typeof Buffer !== 'undefined') return Buffer.from(str, 'utf-8').toString('base64');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const enc1 = str.charCodeAt(i) >> 2;
    const enc2 = ((str.charCodeAt(i) & 3) << 4) | (str.charCodeAt(i + 1) >> 4);
    const enc3 = isNaN(str.charCodeAt(i + 1)) ? 64 : ((str.charCodeAt(i + 1) & 15) << 2) | (str.charCodeAt(i + 2) >> 6);
    const enc4 = isNaN(str.charCodeAt(i + 2)) ? 64 : str.charCodeAt(i + 2) & 63;
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export class PayPalService {
  /**
   * Fetches an OAuth 2.0 Bearer Token from PayPal Sandbox
   */
  static async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && tokenExpiresAt > now + 60000) {
      return cachedToken;
    }

    const clientId = getPayPalClientId();
    const clientSecret = getPayPalClientSecret();
    const authHeader = `Basic ${safeB64Encode(`${clientId}:${clientSecret}`)}`;

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[PayPal Sandbox Auth Error]', errText);
      throw new Error(`PayPal Auth Failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
    return cachedToken as string;
  }

  /**
   * Converts INR amount to USD
   */
  static convertInrToUsd(amountInr: number): string {
    const usd = Math.max(0.50, amountInr / 85.0);
    return usd.toFixed(2);
  }

  /**
   * Creates a PayPal Sandbox Order (v2/checkout/orders)
   */
  static async createOrder(params: CreatePayPalOrderParams): Promise<PayPalOrderResult> {
    const token = await this.getAccessToken();
    const amountUsd = this.convertInrToUsd(params.amountInr);
    const refId = params.orderReferenceId || `ORD-${Date.now()}`;

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: refId,
          description: params.description,
          amount: {
            currency_code: 'USD',
            value: amountUsd,
          },
        },
      ],
      application_context: {
        brand_name: 'IQOOistant Conversational Commerce',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: 'https://example.com/paypal/return',
        cancel_url: 'https://example.com/paypal/cancel',
      },
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[PayPal Sandbox Order Creation Error]', errText);
      throw new Error(`PayPal Order Creation Failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const links = data.links || [];
    const approveLink = links.find((l: any) => l.rel === 'approve')?.href || `https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`;

    return {
      id: data.id,
      status: data.status,
      approvalUrl: approveLink,
      amountUsd,
      amountInr: params.amountInr,
      statusUrl: `${PAYPAL_API_BASE}/v2/checkout/orders/${data.id}`,
    };
  }

  /**
   * Checks real-time order status from PayPal Sandbox
   */
  static async checkOrderStatus(orderId: string): Promise<{ status: string; id: string; raw: any }> {
    const token = await this.getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`PayPal Check Order Failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      raw: data,
    };
  }

  /**
   * Captures an approved PayPal Order
   */
  static async captureOrder(orderId: string): Promise<{ status: string; id: string; captureId?: string }> {
    const token = await this.getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[PayPal Capture Error]', errText);
      throw new Error(`PayPal Capture Failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    return {
      id: data.id,
      status: data.status,
      captureId,
    };
  }
}
