# 💳 PayBuild: Agentic Commerce Gateway with PayPal

<div align="center">

![PayPal Hackathon](https://img.shields.io/badge/PayPal_AI_Hackathon-2026_Submission-003087?style=for-the-badge&logo=paypal&logoColor=white)
![Gemini 2.5](https://img.shields.io/badge/Gemini_2.5_Flash-Agentic_Orchestrator-0070BA?style=for-the-badge&logo=google&logoColor=white)
![PayPal Orders v2](https://img.shields.io/badge/PayPal_Orders_v2-REST_API-FFC439?style=for-the-badge&logo=paypal&logoColor=black)
![React & Vite](https://img.shields.io/badge/Vite_React_19-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![React Native](https://img.shields.io/badge/React_Native_Android-Companion_App-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-Edge_Relay-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

<p align="center">
  <b>A unified, cross-platform agentic ecosystem bringing typed multi-merchant tool calling, interactive rich carousels, and zero-trust, bank-grade PayPal payment authorizations to desktop and mobile.</b>
</p>

[📱 Download Android APKs](#-downloadable-apks-ready-to-test) • [📐 Architecture & Security](#-system-architecture--zero-trust-security) • [🔄 End-to-End User Flows](#-end-to-end-user-flows) • [✨ Core Features](#-core-features-deep-dive) • [🚀 Quickstart & Setup](#-getting-started) • [📝 Devpost Narrative](#-devpost-story)

</div>

---

## 📌 Executive Summary

**The Problem:** Today, everyday consumer journeys are severely fragmented—forcing users into a frustrating multi-app juggle. A consumer consults an AI agent like Gemini for travel or dining recommendations, leaves to open individual merchant apps (e.g., MakeMyTrip, RedBus, Blinkit, Zomato) to manually recreate their query, compare options, and enter addresses, and finally switches yet again to a payment app or browser checkout to authenticate credentials. This friction breaks contextual continuity and leads to steep checkout abandonment rates across digital commerce.

**The Solution:** **PayBuild** collapses this entire journey into a seamless, conversational flow powered by **Gemini 2.5 Flash** and **PayPal's global payment rails**. By bridging natural language understanding with typed merchant tools (Android App Functions & Web APIs) and native rich interactive carousels, PayBuild lets users discover, customize, and select bookings without ever leaving the conversation. When ready to purchase, a zero-trust **PayPal Order** is generated with cryptographic intent and dispatched to the user's secure **PayPal Companion App** (or web drawer) for 1-click biometric authorization. The assistant instantly receives real-time webhook confirmation, updates to **"Payment Done"**, and delivers confirmation receipts—slashing multi-app purchase latency from minutes to seconds.

---

## 📐 System Architecture & Zero-Trust Security

PayBuild strictly follows a **Zero-Trust Commerce Architecture**: the AI runtime orchestrates intent and parameters, but **never touches or sees sensitive payment credentials** (card numbers, CVV, passwords, or biometrics).

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PAYBUILD AGENTIC COMMERCE ARCHITECTURE                                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

     ┌───────────────────────┐
 1   │   Merchant Services   │ ──Registers Typed Schemas──► ┌──────────────────────────────────────────┐
     │ (MMT, RedBus, Zomato) │                              │       Typed Commerce Tool Registry       │
     └───────────────────────┘                              │  - JSON Schemas & Strict Param Validation│
                                                            │  - Rate Limiting & Audit Guardrails      │
     ┌───────────────────────┐ 2 AI Discovers Typed Schemas │  - Dynamic Merchant Context              │
     │  PayBuild AI Runtime  │ ◄─────────────────────────── └──────────────────────────────────────────┘
     │ (Gemini 2.5 Flash Web │                                                    ▲
     │  & Mobile Assistant)  │                                                    │
     └──────────┬────────────┘                                                    │
                │ 3 Typed Function Execution (hotel_id, date, seats, total)       │
                ▼                                                                 │
     ┌───────────────────────┐                                                    │
     │ Cloudflare Edge Relay │ ◄──────────────────────────────────────────────────┘
     │   (/api/relay & SSE)  │
     └──────────┬────────────┘
                │ 4 Create PayPal v2 Order Intent (capture: true, intent: AUTHORIZE)
                ▼
     ┌───────────────────────┐          5 Isolated Biometric Approval        ┌─────────────────────────┐
     │  PayPal Companion App │ ────────────────────────────────────────────► │ User Hardware Biometric │
     │  (Native Android APK  │ ◄── Cryptographic Confirmation / Passkey ──── │ (Face Unlock / Touch ID │
     │   & Web Sandbox Modal)│                                               │  or Secure PIN)         │
     └──────────┬────────────┘                                               └─────────────────────────┘
                │ 6 PayPal Global Processing Rails (Orders v2 API)
                ▼
     ┌───────────────────────┐ 7 Real-Time Webhook Notification (SSE / Polling)
     │ Merchant Confirmation │ ────────────────────────────────────────────► AI & User Real-Time Receipt
     └───────────────────────┘
```

### 🛡️ Core Security Principles
* **Zero-Credential Exposure**: The LLM model prompt and context window contain zero bank or card secrets. Payment intents are cryptographically linked to the specific session order ID.
* **Deterministic Parameter Validation**: Function calling enforces strict schema typing, preventing prompt-injection attacks from altering merchant destinations, currency codes, or decimal amounts.
* **Bank-Grade PayPal Rails**: Payment settlement executes entirely within PayPal's PCI-DSS Level 1 compliant infrastructure, offering buyer protection and dispute resolution out of the box.

---

## 📱 Downloadable APKs (Ready to Test)

Precompiled, production-ready Android APKs are included directly within this repository for rapid testing and evaluation:

| App Package | Version | Description | Path |
| :--- | :--- | :--- | :--- |
| **PayPal Companion** | `v1.0` | Native Android Companion App with deep linking (`chromepe://`), biometric approval modal, and real-time balance card. | [`apks/PayPal-v1.0.apk`](apks/PayPal-v1.0.apk) |
| **GGemini Assistant** | `v1.0` | Native Android Voice & Multimodal Assistant with Android App Functions (AAF) client. | [`apks/GGemini-v1.0.apk`](apks/GGemini-v1.0.apk) |

> **Direct Installation via ADB:**
> ```bash
> # Install PayPal Companion App
> adb install -r apks/PayPal-v1.0.apk
>
> # Install Gemini Assistant App
> adb install -r apks/GGemini-v1.0.apk
> ```

---

## 🔄 End-to-End User Flows

PayBuild provides unified commerce workflows across both desktop web and native mobile environments:

### 🛍️ Flow 1: Conversational Booking to 1-Click PayPal Checkout
1. **Discovery**: User speaks or types: *"Find a luxury hotel in Jaipur near Hawa Mahal for under $120/night."*
2. **Interactive Carousel**: Gemini selects the `searchHotels` tool, rendering rich interactive cards with verified amenities, ratings, and room options.
3. **Intent Confirmation**: User clicks *"Book with PayPal"* or says *"Proceed with booking"*.
4. **Isolated Authorization**: The Cloudflare relay generates a PayPal v2 order intent. A native push notification / deep link opens the **PayPal Companion App**, showing merchant, order details, and currency breakdown.
5. **Biometric Settlement**: User authenticates with Face ID/Touch ID or taps *"Approve with PayPal"*.
6. **Instant Order Confirmation**: Webhook triggers instant confirmation in the chat with PNR reservation and receipt.

```
┌────────────────────────────────┐         ┌────────────────────────────────┐         ┌────────────────────────────────┐
│      Step 1: Chat Assistant    │         │   Step 2: PayPal Companion     │         │      Step 3: Receipt Issued    │
│                                │         │                                │         │                                │
│  • Natural language search     │         │  • Incoming approval prompt    │         │  • Biometric auth verified     │
│  • Rich hotel/ticket carousel  │───────► │  • Verified merchant & amount  │───────► │  • Real-time webhook fires     │
│  • User selects preferred card │         │  • Source: PayPal Balance / Visa│        │  • Status: "COMPLETED"         │
│  • Zero-trust intent triggered │         │  • User taps "Approve"         │         │  • Digital receipt & PNR shown │
└────────────────────────────────┘         └────────────────────────────────┘         └────────────────────────────────┘
```

---

## ✨ Core Features Deep Dive

### 1. Multi-Merchant Agentic Tools
* **MakeMyTrip (Hotels)**: Live room inventory, star ratings, cancellation policies, and booking vouchers.
* **RedBus (Intercity Transit)**: Route searches, sleeper/seater seat layouts, boarding points, and instant bus PNRs.
* **Blinkit & Zomato (Quick-Commerce & Dining)**: Real-time food delivery and 10-minute grocery cart building with dynamic total calculation.

### 2. Interactive Rich Media Carousels
Unlike typical text-heavy LLM outputs, PayBuild generates responsive, clickable card carousels directly inside the chat feed with image galleries, price badges, and direct selection controls.

### 3. Real-Time Webhook Engine & Edge Relay
* Built on Cloudflare Workers / Fastify edge endpoints.
* Bi-directional Server-Sent Events (SSE) keep the client UI synchronized with asynchronous payment events without wasteful polling.
* Auto-reconnecting fallback channel ensures reliability even in spotty network conditions.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** v18.0.0 or higher
* **npm** or **yarn**
* **Android Studio** (optional, for running Android emulator or compiling native code)
* **PayPal Developer Account** (for sandbox client credentials)

### 1. Clone the Repository
```bash
git clone https://github.com/sohamyedgaonkar/ai-builder-hackathon.git
cd ai-builder-hackathon
```

### 2. Configure Environment Variables
Create a `.env` or `.env.local` file inside `web-iqooistant/`:
```env
# Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# PayPal Sandbox Credentials
VITE_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
VITE_PAYPAL_ENV=sandbox

# Edge Relay Configuration
VITE_RELAY_URL=http://localhost:3000/api/relay
```

### 3. Run the Web Application
```bash
cd web-iqooistant
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to experience the desktop agentic commerce interface.

### 4. Build or Run the Android Companion App
```bash
cd ../chromepeapp
npm install

# Run on connected Android device / emulator
npm run android

# Or build standalone release APK:
cd android
./gradlew assembleRelease
```
The output APK is generated at `chromepeapp/android/app/build/outputs/apk/release/app-release.apk`.

---

## 📝 Devpost Story

### ## Inspiration
Digital commerce today is plagued by friction. Finding recommendations in an AI chat, hunting down items in merchant apps, and bouncing through third-party payment gateways causes high cart abandonment. We envisioned an agentic world where an intelligent companion doesn't just suggest—it completes commerce end-to-end with the trust and global reach of PayPal.

### ## What it does
PayBuild unites multimodal conversational discovery with native merchant tooling and 1-click PayPal payment authorizations. Users can plan trips, book hotels, reserve buses, and order meals in natural conversation. When ready, PayBuild generates a zero-trust payment order for instant biometric approval on PayPal.

### ## How we built it
* **AI Engine**: Gemini 2.5 Flash orchestrates conversation and schema-driven tool calling.
* **Commerce APIs**: Custom microservices interface with MakeMyTrip, RedBus, and quick-commerce providers.
* **Payment Engine**: PayPal Orders v2 REST API running on an ultra-low-latency Cloudflare Edge Relay with real-time SSE.
* **Frontend Clients**: React 19 + Vite desktop web app and a React Native Android Companion App (`com.chromepe`) featuring biometric authentication and deep linking.

### ## Challenges we ran into
1. **Zero-Trust Security Boundary**: Guaranteeing that the AI reasoning context never accesses sensitive bank credentials required isolating authorization to a dedicated PayPal application modal.
2. **Sub-second Webhook Synchronization**: Keeping the chat interface in lockstep with asynchronous payment captures led us to design an SSE stream with deterministic order ID matching.
3. **Cross-Platform Consistency**: Ensuring identical carousels and deep-link behavior across mobile and web.

### ## Accomplishments that we're proud of
* Zero checkout drop-off latency: reducing an 8-step, 3-minute booking flow down to a single conversational interaction and a 1-click biometric tap.
* Strict zero-trust payment flow: 100% compliance with financial privacy standards.
* Production-ready, native Android APKs built and packaged for instantaneous testing.

### ## What we learned
Agentic commerce requires rock-solid type safety. By combining strict JSON schema contracts with PayPal's robust order lifecycle, LLMs transition from playful chatbots into trusted, enterprise-grade commerce agents.

### ## What's next for Pay Build : Agentic Infra for Payments
* Multi-agent split payments and group checkout for group travel.
* Autonomous agentic subscriptions with custom spending caps and automated PayPal billing agreements.
* Native integration with the upcoming Android App Functions (AAF) system API on Android 16.

---

## 🛠️ Built With
`paypal` • `paypal-api` • `react` • `react-native` • `typescript` • `android` • `gemini` • `google-gemini` • `cloudflare-workers` • `vite` • `rest-api` • `webhooks` • `fintech` • `ai` • `llm` • `agentic-ai` • `mobile` • `nodejs` • `python` • `ffmpeg` • `speech-recognition` • `javascript` • `json` • `css3`

---

## 📄 License
This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
