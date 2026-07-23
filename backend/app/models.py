from datetime import datetime
from typing import Optional, List, Dict
from sqlmodel import SQLModel, Field, Relationship

class Trip(SQLModel, table=True):
    id: str = Field(primary_key=True)
    passenger_name: str
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    status: str  # ON_TIME, DELAYED, CANCELED
    loyalty_program: str  # Delta SkyMiles, Amex Centurion, etc.
    hotel_preference: str  # Marriott, Hilton, etc.
    seat_preference: str  # Window, Aisle
    food_preference: str  # Vegetarian, Gluten-Free, None
    max_budget: float  # Maximum budget in USD for automated choices

class AgentAuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    trip_id: str
    agent_name: str
    status: str  # SUCCESS, WARNING, FAILURE, INFO
    action_taken: str
    output_data: str  # JSON formatted details or plain text
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class FlightOption(SQLModel, table=True):
    id: str = Field(primary_key=True)
    trip_id: str
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    price: float
    airline: str
    score: float = 0.0

class HotelOption(SQLModel, table=True):
    id: str = Field(primary_key=True)
    trip_id: str
    name: str
    price_per_night: float
    rating: float
    distance_from_airport: float  # in miles
    score: float = 0.0

class DisruptionEvent(SQLModel, table=True):
    id: str = Field(primary_key=True)
    trip_id: str
    event_type: str  # DELAY, CANCELLATION
    reason: str
    original_departure: datetime
    simulated_at: datetime = Field(default_factory=datetime.utcnow)
