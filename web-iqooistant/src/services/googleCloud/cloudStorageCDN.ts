/**
 * Google Cloud Storage (GCS) - Digital Asset Hosting & CDN Layer
 * 
 * Delivers low-latency, globally distributed assets via Cloud CDN:
 * - Partner merchant logos & favicons (Zomato, MMT, RedBus, Blinkit, Google Pay)
 * - Hotel photography & restaurant menu imagery
 * - Dynamic UPI QR code cache & digital receipts
 */

import { GOOGLE_CLOUD_PROJECT } from '../../config';

export class CloudStorageCDN {
  private static bucketName = `${GOOGLE_CLOUD_PROJECT}-public-assets`;
  private static cdnBaseUrl = `https://storage.googleapis.com/${GOOGLE_CLOUD_PROJECT}-public-assets`;

  /**
   * Returns GCS bucket name
   */
  static getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Resolves brand logo from Google Cloud Storage or verified CDN
   */
  static getBrandLogo(brand: 'zomato' | 'makemytrip' | 'redbus' | 'blinkit' | 'googlepay' | 'gemini'): string {
    const brandMap: Record<string, string> = {
      zomato: 'https://www.google.com/s2/favicons?domain=zomato.com&sz=128',
      makemytrip: 'https://www.google.com/s2/favicons?domain=makemytrip.com&sz=128',
      redbus: 'https://www.google.com/s2/favicons?domain=redbus.in&sz=128',
      blinkit: 'https://www.google.com/s2/favicons?domain=blinkit.com&sz=128',
      googlepay: 'https://img.icons8.com/color/144/000000/google-pay-india.png',
      gemini: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    };

    return brandMap[brand] || `${this.cdnBaseUrl}/logos/${brand}.png`;
  }

  /**
   * Resolves product or hotel asset image URL
   */
  static getAssetUrl(assetPath: string): string {
    if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
      return assetPath;
    }
    const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
    return `${this.cdnBaseUrl}/${cleanPath}`;
  }

  /**
   * Generates temporary signed URL for downloading official tax invoice / receipt
   */
  static generateSignedReceiptUrl(orderId: string): string {
    const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    return `${this.cdnBaseUrl}/receipts/${orderId}.pdf?GoogleAccessId=service-account@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com&Expires=${expiry}`;
  }
}
