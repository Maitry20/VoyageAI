import asyncio
import logging
from datetime import datetime
import json
from typing import Dict, Any, List
from sqlmodel import Session, select
from app.database import engine
from app.models import Trip, AgentAuditLog, FlightOption, HotelOption, DisruptionEvent
from app.agents.graph import compiled_graph

logger = logging.getLogger(__name__)

# In-memory status of running simulations
# Key: trip_id, Value: dict containing status and current agent
running_simulations: Dict[str, Dict[str, Any]] = {}

def get_running_simulation(trip_id: str) -> Dict[str, Any]:
    return running_simulations.get(trip_id, {"is_running": False, "current_agent": None})

def populate_mock_data():
    """Populates default trips in the SQLite database if they don't exist."""
    with Session(engine) as session:
        # Check if trips exist
        existing = session.exec(select(Trip)).first()
        if existing:
            return
            
        trips = [
            Trip(
                id="trip-001",
                passenger_name="Maitry Patel",
                flight_number="AA-104",
                origin="JFK",
                destination="LHR",
                departure_time=datetime.utcnow() + timedelta_helper(hours=3),
                status="ON_TIME",
                loyalty_program="Amex Centurion",
                hotel_preference="Marriott",
                seat_preference="Window",
                food_preference="Vegetarian",
                max_budget=900.0
            ),
            Trip(
                id="trip-002",
                passenger_name="John Doe",
                flight_number="UA-205",
                origin="LAX",
                destination="HNL",
                departure_time=datetime.utcnow() + timedelta_helper(hours=5),
                status="ON_TIME",
                loyalty_program="Delta Medallion Gold",
                hotel_preference="Hilton",
                seat_preference="Aisle",
                food_preference="Gluten-Free",
                max_budget=600.0
            ),
            Trip(
                id="trip-003",
                passenger_name="Sarah Connor",
                flight_number="DL-342",
                origin="LHR",
                destination="SFO",
                departure_time=datetime.utcnow() + timedelta_helper(hours=2),
                status="ON_TIME",
                loyalty_program="Oneworld Emerald",
                hotel_preference="Hyatt",
                seat_preference="Window",
                food_preference="None",
                max_budget=1500.0
            )
        ]
        
        for t in trips:
            session.add(t)
        session.commit()

def timedelta_helper(**kwargs):
    from datetime import timedelta
    return timedelta(**kwargs)

async def run_disruption_simulation(trip_id: str, event_type: str, reason: str, delay_hours: int = 0):
    """
    Asynchronously runs the LangGraph simulation for a disrupted flight.
    It executes the graph steps, inserts logs in the DB, and simulates real-time delays.
    """
    running_simulations[trip_id] = {"is_running": True, "current_agent": "Supervisor"}
    
    with Session(engine) as session:
        # Get trip from DB
        trip = session.get(Trip, trip_id)
        if not trip:
            running_simulations[trip_id] = {"is_running": False, "current_agent": None}
            return
            
        # Update trip status
        trip.status = "CANCELED" if event_type == "CANCELLATION" else "DELAYED"
        session.add(trip)
        
        # Clean up old logs, flights, hotels for this simulation run
        session.exec(select(AgentAuditLog).where(AgentAuditLog.trip_id == trip_id)).all()
        old_logs = session.exec(select(AgentAuditLog).where(AgentAuditLog.trip_id == trip_id)).all()
        for log in old_logs:
            session.delete(log)
            
        old_flights = session.exec(select(FlightOption).where(FlightOption.trip_id == trip_id)).all()
        for f in old_flights:
            session.delete(f)
            
        old_hotels = session.exec(select(HotelOption).where(HotelOption.trip_id == trip_id)).all()
        for h in old_hotels:
            session.delete(h)
            
        session.commit()

        # Log disruption event
        event = DisruptionEvent(
            id=f"evt-{trip_id}-{int(datetime.utcnow().timestamp())}",
            trip_id=trip_id,
            event_type=event_type,
            reason=reason,
            original_departure=trip.departure_time,
            simulated_at=datetime.utcnow()
        )
        session.add(event)
        session.commit()

        # Initialize LangGraph state
        initial_state = {
            "trip_id": trip_id,
            "disruption_event": {
                "event_type": event_type,
                "reason": reason,
                "delay_hours": delay_hours,
                "origin": trip.origin,
                "destination": trip.destination,
                "original_departure": trip.departure_time.isoformat()
            },
            "agent_logs": [],
            "flight_options": [],
            "hotel_options": [],
            "transport_options": [],
            "selected_flight": None,
            "selected_hotel": None,
            "selected_transport": None,
            "passenger_preferences": {
                "preferred_airline": "Delta Air Lines" if trip.loyalty_program.startswith("Delta") else "American Airlines",
                "hotel_preference": trip.hotel_preference,
                "seat_preference": trip.seat_preference,
                "food_preference": trip.food_preference,
                "max_budget": trip.max_budget
            },
            "policy_compliance": None,
            "notification_sent": False,
            "audit_logged": False,
            "next_agent": "Supervisor"
        }

    try:
        # Run graph step-by-step
        state = initial_state
        
        async for output in compiled_graph.astream(state):
            # output is a dict, e.g., {'Flight Monitoring': {'agent_logs': [...], 'next_agent': 'Supervisor'}}
            node_name, state_updates = next(iter(output.items()))
            
            # Update state with changes
            state.update(state_updates)
            
            # Update current active agent status for frontend indicator
            running_simulations[trip_id]["current_agent"] = node_name
            
            # If the node has logs, write the latest log to the database
            if "agent_logs" in state_updates and len(state_updates["agent_logs"]) > 0:
                latest_log_dict = state_updates["agent_logs"][-1]
                
                with Session(engine) as db_session:
                    audit_log = AgentAuditLog(
                        trip_id=trip_id,
                        agent_name=latest_log_dict["agent_name"],
                        status=latest_log_dict["status"],
                        action_taken=latest_log_dict["action_taken"],
                        output_data=latest_log_dict["output_data"],
                        timestamp=datetime.fromisoformat(latest_log_dict["timestamp"])
                    )
                    db_session.add(audit_log)
                    db_session.commit()
                    
            # If this is Flight Rebooking, save mock flights to DB for visibility in dashboard
            if node_name == "Flight Rebooking" and "flight_options" in state_updates:
                with Session(engine) as db_session:
                    for fl in state_updates["flight_options"]:
                        fl_opt = FlightOption(
                            id=fl["id"],
                            trip_id=trip_id,
                            flight_number=fl["flight_number"],
                            origin=fl["origin"],
                            destination=fl["destination"],
                            departure_time=datetime.fromisoformat(fl["departure_time"]),
                            price=fl["price"],
                            airline=fl["airline"],
                            score=fl["score"]
                        )
                        db_session.add(fl_opt)
                    db_session.commit()
                    
            # If Hotel Management node ran, save mock hotels to DB for dashboard
            if node_name == "Hotel Management" and "hotel_options" in state_updates:
                with Session(engine) as db_session:
                    for ht in state_updates["hotel_options"]:
                        ht_opt = HotelOption(
                            id=ht["id"],
                            trip_id=trip_id,
                            name=ht["name"],
                            price_per_night=ht["price_per_night"],
                            rating=ht["rating"],
                            distance_from_airport=ht["distance_from_airport"],
                            score=ht["score"]
                        )
                        db_session.add(ht_opt)
                    db_session.commit()
            
            # Insert artificial delay so users can see each agent think and act in real-time
            await asyncio.sleep(1.2)
            
    except Exception as e:
        logger.exception("Error in running LangGraph simulation")
        with Session(engine) as db_session:
            error_log = AgentAuditLog(
                trip_id=trip_id,
                agent_name="System",
                status="FAILURE",
                action_taken="Execution failed with exception.",
                output_data=str(e),
                timestamp=datetime.utcnow()
            )
            db_session.add(error_log)
            db_session.commit()
    finally:
        running_simulations[trip_id] = {"is_running": False, "current_agent": None}
