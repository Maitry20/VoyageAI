from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any, Dict

class TripRead(BaseModel):
    id: str
    passenger_name: str
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    status: str
    loyalty_program: str
    hotel_preference: str
    seat_preference: str
    food_preference: str
    max_budget: float

    class Config:
        from_attributes = True

class AgentAuditLogRead(BaseModel):
    id: int
    trip_id: str
    agent_name: str
    status: str
    action_taken: str
    output_data: str
    timestamp: datetime

    class Config:
        from_attributes = True

class FlightOptionRead(BaseModel):
    id: str
    trip_id: str
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    price: float
    airline: str
    score: float

    class Config:
        from_attributes = True

class HotelOptionRead(BaseModel):
    id: str
    trip_id: str
    name: str
    price_per_night: float
    rating: float
    distance_from_airport: float
    score: float

    class Config:
        from_attributes = True

class DisruptionSimulateRequest(BaseModel):
    trip_id: str
    event_type: str  # CANCELLATION, DELAY
    reason: str
    delay_hours: Optional[int] = 0

class TimelineEvent(BaseModel):
    title: str
    timestamp: datetime
    status: str  # SUCCESS, INFO, WARNING, FAILURE
    description: str
    agent: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class SimulationStatusResponse(BaseModel):
    trip: TripRead
    is_running: bool
    current_agent: Optional[str] = None
    timeline: List[TimelineEvent]
    logs: List[AgentAuditLogRead]
    flights: List[FlightOptionRead]
    hotels: List[HotelOptionRead]
