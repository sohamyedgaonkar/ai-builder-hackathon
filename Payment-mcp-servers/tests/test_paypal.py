import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from paypal_client import PayPalClient


@pytest.mark.asyncio
async def test_paypal_access_token():
    client = PayPalClient(client_id="mock_id", client_secret="mock_secret")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"access_token": "mock_token_abc", "expires_in": 3600}

    with patch("paypal_client.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_class.return_value = mock_client

        token = await client.get_access_token()
        assert token == "mock_token_abc"


@pytest.mark.asyncio
async def test_paypal_create_order():
    client = PayPalClient(client_id="mock_id", client_secret="mock_secret")

    mock_auth_resp = MagicMock()
    mock_auth_resp.status_code = 200
    mock_auth_resp.json.return_value = {"access_token": "mock_token_abc", "expires_in": 3600}

    mock_order_resp = MagicMock()
    mock_order_resp.status_code = 201
    mock_order_resp.json.return_value = {
        "id": "5X563388P1281533P",
        "status": "CREATED",
        "links": [
            {"rel": "approve", "href": "https://www.sandbox.paypal.com/checkoutnow?token=5X563388P1281533P"}
        ]
    }

    with patch("paypal_client.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.post.side_effect = [mock_auth_resp, mock_order_resp]
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_class.return_value = mock_client

        order = await client.create_order(amount_inr=850, description="Test Order")
        assert order["id"] == "5X563388P1281533P"
        assert order["status"] == "CREATED"
        assert order["amount_usd"] == "10.00"
        assert "checkoutnow" in order["approval_url"]
