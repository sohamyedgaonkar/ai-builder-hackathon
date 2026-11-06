import os
import base64
import httpx
from dotenv import load_dotenv

load_dotenv()

PAYPAL_API_BASE = os.getenv("PAYPAL_API_BASE", "https://api-m.sandbox.paypal.com")

def _get_client_id() -> str:
    # Encoded fallback for safety / CI / demo if not set in env
    encoded = "QWQ3NXh0NGp0WTlDTlZrRHZhd1lpbmhqNlk3a3BoSVRwOUFDWV9GMWhRcllQaWN5dGVEOHAwdGM4eEgzbXJvLU9fc0dJcnphSlAyTXdwWjE="
    return os.getenv("PAYPAL_CLIENT_ID") or base64.b64decode(encoded).decode("utf-8")

def _get_client_secret() -> str:
    encoded = "RURWdVdTUy0zaXNBSFgyRkFlVXR2ck9JX3dvMWN4eDNJNmNfVnVILWNLRGVVMXNJNG5ObmFMOTBKVGsxVVlCbUlSeXZRaWhLTnRESC1NSEg="
    return os.getenv("PAYPAL_CLIENT_SECRET") or base64.b64decode(encoded).decode("utf-8")

_cached_token = None
_token_expires_at = 0

class PayPalClient:
    def __init__(self, client_id: str | None = None, client_secret: str | None = None):
        self.client_id = client_id or _get_client_id()
        self.client_secret = client_secret or _get_client_secret()

    async def get_access_token(self) -> str:
        credentials = f"{self.client_id}:{self.client_secret}"
        b64_auth = base64.b64encode(credentials.encode()).decode()

        headers = {
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {"grant_type": "client_credentials"}

        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{PAYPAL_API_BASE}/v1/oauth2/token", headers=headers, data=data)
            resp.raise_for_status()
            data = resp.json()
            return data["access_token"]

    @staticmethod
    def inr_to_usd(amount_inr: float | int) -> str:
        usd = max(0.50, float(amount_inr) / 85.0)
        return f"{usd:.2f}"

    async def create_order(self, amount_inr: float | int, description: str, reference_id: str | None = None) -> dict:
        token = await self.get_access_token()
        amount_usd = self.inr_to_usd(amount_inr)

        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": reference_id or "ORD-DEFAULT",
                    "description": description,
                    "amount": {
                        "currency_code": "USD",
                        "value": amount_usd,
                    },
                }
            ],
            "application_context": {
                "brand_name": "PayPal Sandbox FastMCP",
                "landing_page": "BILLING",
                "user_action": "PAY_NOW",
                "return_url": "https://example.com/success",
                "cancel_url": "https://example.com/cancel",
            },
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{PAYPAL_API_BASE}/v2/checkout/orders", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        approve_link = next((l["href"] for l in data.get("links", []) if l.get("rel") == "approve"), None)

        return {
            "id": data["id"],
            "status": data["status"],
            "approval_url": approve_link or f"https://www.sandbox.paypal.com/checkoutnow?token={data['id']}",
            "amount_usd": amount_usd,
            "amount_inr": amount_inr,
            "raw": data,
        }

    async def check_order_status(self, order_id: str) -> dict:
        token = await self.get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{PAYPAL_API_BASE}/v2/checkout/orders/{order_id}", headers=headers)
            resp.raise_for_status()
            return resp.json()

    async def capture_order(self, order_id: str) -> dict:
        token = await self.get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{PAYPAL_API_BASE}/v2/checkout/orders/{order_id}/capture", headers=headers)
            resp.raise_for_status()
            return resp.json()
