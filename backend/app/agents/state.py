from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    trip_id: str
    disruption_event: Optional[Dict[str, Any]]
    agent_logs: List[Dict[str, Any]]
    flight_options: List[Dict[str, Any]]
    hotel_options: List[Dict[str, Any]]
    transport_options: List[Dict[str, Any]]
    selected_flight: Optional[Dict[str, Any]]
    selected_hotel: Optional[Dict[str, Any]]
    selected_transport: Optional[Dict[str, Any]]
    passenger_preferences: Optional[Dict[str, Any]]
    policy_compliance: Optional[Dict[str, Any]]
    notification_sent: bool
    audit_logged: bool
    next_agent: str  # Dictates the Supervisor's next destination
