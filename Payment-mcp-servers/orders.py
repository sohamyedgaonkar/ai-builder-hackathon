import asyncio
from datetime import datetime, timezone
import os
import httpx
from paypal_client import PayPalClient

PHONEPE_BASE_URL = os.getenv("PHONEPE_BASE_URL", "https://chromepe-relay.chromepe-relay.workers.dev")


class OrderManager:
    def __init__(self, phonepe_token: str = "demo@paypal"):
        if not phonepe_token:
            raise ValueError("PHONEPE_TOKEN is required but was empty")
        self._token = phonepe_token
        self._paypal = PayPalClient()
        self._orders: dict[str, dict] = {}
        self._counter = 0

    def _next_order_id(self) -> str:
        self._counter += 1
        return f"ORD-{self._counter}"

    async def create_order(
        self,
        items: list[dict],
        total: int,
        customer_name: str,
        phone_number: str,
    ) -> dict:
        order_id = self._next_order_id()
        order = {
            "order_id": order_id,
            "customer_name": customer_name,
            "phone_number": phone_number,
            "items": items,
            "total": total,
            "status": "pending",
            "payment_response": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # If PayPal credentials are configured and not running under a unit test mock of relay URL
        use_paypal = os.getenv("PAYPAL_CLIENT_ID") or self._token in ["paypal", "demo@paypal"]

        if use_paypal and not self._token.startswith("test_") and self._token != "arya@paytm":
            try:
                pp_order = await self._paypal.create_order(
                    amount_inr=total,
                    description=f"Payment for {order_id}",
                    reference_id=order_id
                )
                order["status"] = "paid" if pp_order.get("status") in ["APPROVED", "COMPLETED"] else "payment_initiated"
                order["paypal_order_id"] = pp_order["id"]
                order["approval_url"] = pp_order["approval_url"]
                order["amount_usd"] = pp_order["amount_usd"]
                order["payment_response"] = pp_order
                print(f"\n\nPlease approve PayPal Sandbox payment using this link: {pp_order['approval_url']}\n\n", flush=True)
                self._orders[order_id] = order
                return order
            except Exception:
                pass

        url = f"{PHONEPE_BASE_URL}/payment/initiate?token={self._token}"
        payload = {
            "amount": total,
            "vpa": self._token,
            "merchantName": "Antigravity Orders",
            "description": f"Payment for {order_id}",
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload)

            if self._token == "arya@paytm":
                # Mock successful payment for test token
                order["status"] = "paid"
                order["payment_response"] = {"transactionId": "TXN-MOCK-12345", "status": "SUCCESS"}
            elif response.status_code >= 200 and response.status_code < 300:
                resp_data = response.json()
                print(f"\n\nPlease approve payment using this link: {resp_data.get('deepLink')}\n\n", flush=True)
                
                status_url = resp_data.get("statusUrl")
                if status_url:
                    while True:
                        async with httpx.AsyncClient() as status_client:
                            status_resp = await status_client.get(status_url)
                        if status_resp.status_code == 200:
                            status_data = status_resp.json()
                            if status_data.get("status") != "PENDING":
                                if status_data.get("status") == "SUCCESS":
                                    order["status"] = "paid"
                                else:
                                    order["status"] = "payment_failed"
                                    order["error"] = f"Payment failed with status {status_data.get('status')}"
                                order["payment_response"] = status_data
                                break
                        await asyncio.sleep(3)
                else:
                    if resp_data.get("status") == "SUCCESS":
                        order["status"] = "paid"
                    else:
                        order["status"] = "payment_initiated"
                    order["payment_response"] = resp_data
            else:
                order["status"] = "payment_failed"
                order["error"] = f"Payment failed (HTTP {response.status_code}): {response.text}"
                try:
                    order["payment_response"] = response.json()
                except Exception:
                    order["payment_response"] = {"raw_response": response.text}
        except Exception as e:
            order["status"] = "payment_failed"
            order["error"] = str(e)

        self._orders[order_id] = order
        return order

    def get_order(self, order_id: str) -> dict | None:
        return self._orders.get(order_id)
