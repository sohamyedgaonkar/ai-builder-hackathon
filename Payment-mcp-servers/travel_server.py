import json
import os

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

from travel_data import search_buses as _search_buses
from travel_data import search_trains as _search_trains
from travel_data import search_flights as _search_flights
from travel_data import get_option_by_id
from trip_manager import TripManager
from travel_bookings import BookingManager

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

mcp = FastMCP("travel-booking")
trip = TripManager()
booking_manager = BookingManager(phonepe_token=phonepe_token)


@mcp.tool()
async def search_buses(from_city: str, to_city: str) -> str:
    """Search available buses between two Indian cities."""
    results = _search_buses(from_city, to_city)
    if not results:
        return f"No buses found from {from_city} to {to_city}."
    return json.dumps(results, indent=2)


@mcp.tool()
async def search_trains(from_city: str, to_city: str) -> str:
    """Search available trains between two Indian cities."""
    results = _search_trains(from_city, to_city)
    if not results:
        return f"No trains found from {from_city} to {to_city}."
    return json.dumps(results, indent=2)


@mcp.tool()
async def search_flights(from_city: str, to_city: str) -> str:
    """Search available flights between two Indian cities."""
    results = _search_flights(from_city, to_city)
    if not results:
        return f"No flights found from {from_city} to {to_city}."
    return json.dumps(results, indent=2)


@mcp.tool()
async def add_to_trip(option_id: str) -> str:
    """Add a bus, train, or flight to your trip plan by its ID (e.g. BUS-1, TRN-3, FLT-5)."""
    result = trip.add(option_id)
    if not result["success"]:
        return f"Error: {result['error']}"

    option = result["option"]
    total = trip.get_total()
    return (
        f"Added {option.get('operator') or option.get('train_name') or option.get('airline')} "
        f"({option['from_city']} → {option['to_city']}) to your trip. "
        f"Trip total: ₹{total}"
    )


@mcp.tool()
async def view_trip() -> str:
    """View the current trip plan with all selected transport options and total cost."""
    if trip.is_empty():
        return "Your trip plan is empty. Search for buses, trains, or flights to get started."

    items = trip.get_items_snapshot()
    lines = ["🗺️ Your Trip Plan:", ""]
    for item in items:
        label = item.get("operator") or item.get("train_name") or item.get("airline")
        lines.append(
            f"  • [{item['id']}] {label} — {item['from_city']} → {item['to_city']} "
            f"| {item['departure']} → {item['arrival']} ({item['duration']}) — ₹{item['price']}"
        )

    lines.append(f"\n  Total: ₹{trip.get_total()}")
    return "\n".join(lines)


@mcp.tool()
async def book_trip_item(option_id: str, passenger_name: str, phone_number: str) -> str:
    """Book and pay for a specific item in your trip plan. Processes payment via PhonePe."""
    option = get_option_by_id(option_id)
    if option is None:
        return f"Error: Option '{option_id}' not found."

    trip_items = trip.view()
    if option_id not in trip_items:
        return f"Error: Option '{option_id}' is not in your trip plan. Add it first."

    booking = await booking_manager.book(
        option=option,
        passenger_name=passenger_name,
        phone_number=phone_number,
    )

    if booking["status"] == "paid":
        trip.remove(option_id)
        return (
            f"✅ Booking confirmed!\n"
            f"  Booking ID: {booking['booking_id']}\n"
            f"  Type: {booking['transport_type'].title()}\n"
            f"  Route: {option['from_city']} → {option['to_city']}\n"
            f"  Amount: ₹{option['price']}\n"
            f"  Status: {booking['status']}\n"
            f"  Payment: {json.dumps(booking.get('payment_response', {}))}"
        )
    else:
        return (
            f"❌ Payment failed for booking {booking['booking_id']}.\n"
            f"  Error: {booking.get('error', 'Unknown error')}\n"
            f"  The item remains in your trip plan. Try again."
        )


@mcp.tool()
async def check_booking_status(booking_id: str) -> str:
    """Check the status of a travel booking by its ID (e.g. TRV-1)."""
    booking = booking_manager.get_booking(booking_id)
    if booking is None:
        return f"Booking '{booking_id}' not found."

    option = booking["option"]
    label = option.get("operator") or option.get("train_name") or option.get("airline")
    lines = [
        f"🎫 Booking {booking['booking_id']}:",
        f"  Type: {booking['transport_type'].title()}",
        f"  Service: {label}",
        f"  Route: {option['from_city']} → {option['to_city']}",
        f"  Passenger: {booking['passenger_name']}",
        f"  Phone: {booking['phone_number']}",
        f"  Status: {booking['status']}",
        f"  Amount: ₹{option['price']}",
        f"  Booked at: {booking['created_at']}",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run()
