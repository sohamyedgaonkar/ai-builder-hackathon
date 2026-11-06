import json
import os

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

from cart import CartManager
from menu import get_all_items, get_items_by_category
from orders import OrderManager

load_dotenv()

phonepe_token = os.getenv("PHONEPE_TOKEN", "")
if not phonepe_token:
    if os.getenv("PAYPAL_CLIENT_ID"):
        phonepe_token = "demo@paypal"
    else:
        raise RuntimeError(
            "PHONEPE_TOKEN or PAYPAL_CLIENT_ID environment variable is required. "
            "Set it in your .env file."
        )

mcp = FastMCP("food-ordering")
cart = CartManager()
order_manager = OrderManager(phonepe_token=phonepe_token)


@mcp.tool()
async def browse_menu(category: str | None = None) -> str:
    """Browse the food menu. Optionally filter by category (Starters, Main Course, Beverages)."""
    if category is not None:
        items = get_items_by_category(category)
        if items is None:
            available = ", ".join(get_all_items().keys())
            return f"Category '{category}' not found. Available categories: {available}"
        return json.dumps({category: items}, indent=2)

    return json.dumps(get_all_items(), indent=2)


@mcp.tool()
async def add_to_cart(item_id: str, quantity: int = 1) -> str:
    """Add a menu item to the cart by its ID (e.g. S1, M2, B3)."""
    result = cart.add(item_id, quantity)
    if not result["success"]:
        return f"Error: {result['error']}"

    total = cart.get_total()
    return (
        f"Added {result['quantity']}x {result['item_name']} to cart. "
        f"Cart total: ₹{total}"
    )


@mcp.tool()
async def view_cart() -> str:
    """View the current cart contents and total."""
    if cart.is_empty():
        return "Your cart is empty. Use browse_menu to see available items."

    items = cart.get_items_snapshot()
    lines = ["🛒 Your Cart:", ""]
    for item in items:
        subtotal = item["price"] * item["quantity"]
        lines.append(f"  • {item['name']} x{item['quantity']} — ₹{subtotal}")

    lines.append(f"\n  Total: ₹{cart.get_total()}")
    return "\n".join(lines)


@mcp.tool()
async def place_order(
    customer_name: str = "Soham Yedgaonkar",
    phone_number: str = "1234567890"
) -> str:
    """Place an order with the current cart items. Processes payment via PhonePe."""
    if cart.is_empty():
        return "Error: Cart is empty. Add items before placing an order."

    items = cart.get_items_snapshot()
    total = cart.get_total()

    order = await order_manager.create_order(
        items=items,
        total=total,
        customer_name=customer_name,
        phone_number=phone_number
    )

    if order["status"] == "paid":
        cart.clear()
        return (
            f"✅ Order placed successfully!\n"
            f"  Order ID: {order['order_id']}\n"
            f"  Total: ₹{order['total']}\n"
            f"  Status: {order['status']}\n"
            f"  Payment: {json.dumps(order.get('payment_response', {}))}"
        )
    else:
        return (
            f"❌ Payment failed for order {order['order_id']}.\n"
            f"  Error: {order.get('error', 'Unknown error')}\n"
            f"  Your cart has been preserved. Try again."
        )


@mcp.tool()
async def check_order_status(order_id: str) -> str:
    """Check the status of an existing order by its ID (e.g. ORD-1)."""
    order = order_manager.get_order(order_id)
    if order is None:
        return f"Order '{order_id}' not found."

    lines = [
        f"📦 Order {order['order_id']}:",
        f"  Customer: {order['customer_name']}",
        f"  Phone: {order['phone_number']}",
        f"  Status: {order['status']}",
        f"  Total: ₹{order['total']}",
        f"  Items:",
    ]
    for item in order["items"]:
        lines.append(f"    • {item['name']} x{item['quantity']} — ₹{item['price']}")
    lines.append(f"  Placed at: {order['created_at']}")
    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run()
