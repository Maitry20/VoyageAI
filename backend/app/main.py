import asyncio
import json
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from app.database import create_db_and_tables, get_session, engine
from app.models import Trip, AgentAuditLog, FlightOption, HotelOption, DisruptionEvent
from app.schemas import (
    TripRead,
    DisruptionSimulateRequest,
    SimulationStatusResponse,
    AgentAuditLogRead,
    FlightOptionRead,
    HotelOptionRead,
    TimelineEvent,
    FlightStatusWebhookRequest
)
from app.services.simulation import populate_mock_data, run_disruption_simulation, get_running_simulation
from app.auth import get_current_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    create_db_and_tables()
    # Insert mock trips
    populate_mock_data()
    yield

app = FastAPI(
    title="VoyageAI API",
    description="Autonomous travel disruption concierge orchestration API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to VoyageAI API"}

@app.get("/api/trips", response_model=List[TripRead])
def list_trips(session: Session = Depends(get_session)):
    trips = session.exec(select(Trip)).all()
    return trips

@app.get("/api/trips/{trip_id}", response_model=TripRead)
def get_trip(trip_id: str, session: Session = Depends(get_session)):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@app.post("/api/trips/{trip_id}/reset")
def reset_trip(trip_id: str, session: Session = Depends(get_session)):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    trip.status = "ON_TIME"
    session.add(trip)
    
    # Delete logs
    logs = session.exec(select(AgentAuditLog).where(AgentAuditLog.trip_id == trip_id)).all()
    for l in logs:
        session.delete(l)
        
    # Delete flight options
    flights = session.exec(select(FlightOption).where(FlightOption.trip_id == trip_id)).all()
    for f in flights:
        session.delete(f)
        
    # Delete hotel options
    hotels = session.exec(select(HotelOption).where(HotelOption.trip_id == trip_id)).all()
    for h in hotels:
        session.delete(h)
        
    # Delete disruption events
    events = session.exec(select(DisruptionEvent).where(DisruptionEvent.trip_id == trip_id)).all()
    for e in events:
        session.delete(e)
        
    session.commit()
    return {"message": f"Trip {trip_id} reset to ON_TIME and history cleared."}

@app.post("/api/simulation/trigger")
def trigger_simulation(
    request: DisruptionSimulateRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    trip = session.get(Trip, request.trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    sim_status = get_running_simulation(request.trip_id)
    if sim_status["is_running"]:
        raise HTTPException(status_code=400, detail="A simulation is already running for this trip")

    # Launch background task
    background_tasks.add_task(
        run_disruption_simulation,
        trip_id=request.trip_id,
        event_type=request.event_type,
        reason=request.reason,
        delay_hours=request.delay_hours
    )
    
    return {"message": "Simulation started in background", "trip_id": request.trip_id}

@app.get("/api/simulation/status/{trip_id}", response_model=SimulationStatusResponse)
def get_simulation_status(trip_id: str, session: Session = Depends(get_session)):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    sim_status = get_running_simulation(trip_id)
    
    # Query logs, flight options, hotel options from DB
    logs = session.exec(
        select(AgentAuditLog)
        .where(AgentAuditLog.trip_id == trip_id)
        .order_by(AgentAuditLog.timestamp.asc())
    ).all()
    
    flights = session.exec(
        select(FlightOption)
        .where(FlightOption.trip_id == trip_id)
        .order_by(FlightOption.score.desc())
    ).all()
    
    hotels = session.exec(
        select(HotelOption)
        .where(HotelOption.trip_id == trip_id)
        .order_by(HotelOption.score.desc())
    ).all()
    
    # Build timeline events from logs
    timeline = []
    
    # First, check if there is an active disruption event
    disruption = session.exec(
        select(DisruptionEvent)
        .where(DisruptionEvent.trip_id == trip_id)
        .order_by(DisruptionEvent.simulated_at.desc())
    ).first()
    
    if disruption:
        timeline.append(TimelineEvent(
            title=f"Flight {disruption.event_type}",
            timestamp=disruption.simulated_at,
            status="FAILURE",
            description=f"Flight {trip.flight_number} disrupted due to {disruption.reason}.",
            agent="Disruption Monitor"
        ))
        
    for log in logs:
        # Create a user-friendly title
        title = log.agent_name
        if log.agent_name == "Supervisor":
            title = "Orchestrator Routing"
        elif log.agent_name == "Flight Monitoring":
            title = "Itinerary Monitor Active"
        elif log.agent_name == "Disruption Detection":
            title = "Severity Analysis"
        elif log.agent_name == "Preference":
            title = "Profile Alignment"
        elif log.agent_name == "Flight Rebooking":
            title = "Flight Alternatives Search"
        elif log.agent_name == "Travel Policy":
            title = "Policy Compliance Check"
        elif log.agent_name == "Hotel Management":
            title = "Lodging Arrangement"
        elif log.agent_name == "Transportation":
            title = "Ground Transit Booked"
        elif log.agent_name == "Notification":
            title = "Passenger Notified"
        elif log.agent_name == "Audit":
            title = "Resolution Audited"
            
        try:
            metadata = json.loads(log.output_data)
        except Exception:
            metadata = {"info": log.output_data}
            
        timeline.append(TimelineEvent(
            title=title,
            timestamp=log.timestamp,
            status=log.status,
            description=log.action_taken,
            agent=log.agent_name,
            metadata=metadata
        ))
        
    # Sort timeline events by timestamp
    timeline.sort(key=lambda x: x.timestamp)
    
    return SimulationStatusResponse(
        trip=trip,
        is_running=sim_status["is_running"],
        current_agent=sim_status["current_agent"],
        timeline=timeline,
        logs=logs,
        flights=flights,
        hotels=hotels
    )


@app.get("/api/simulation/stream/{trip_id}")
async def stream_simulation(
    trip_id: str,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    async def event_generator():
        last_log_count = -1
        while True:
            sim_status = get_running_simulation(trip_id)
            
            with Session(engine) as db_session:
                logs_count = db_session.exec(
                    select(AgentAuditLog).where(AgentAuditLog.trip_id == trip_id)
                ).all()
                
            current_log_count = len(logs_count)
            is_running = sim_status["is_running"]
            
            if current_log_count != last_log_count or is_running:
                status_res = get_simulation_status(trip_id, session=session)
                yield f"data: {status_res.model_dump_json()}\n\n"
                last_log_count = current_log_count
                
            if not is_running and current_log_count == last_log_count:
                break
                
            await asyncio.sleep(1.0)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/webhook/flight-status")
def flight_status_webhook(
    request: FlightStatusWebhookRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    # Find all active trips matching this flight number
    trips = session.exec(select(Trip).where(Trip.flight_number == request.flight_number)).all()
    if not trips:
        return {"message": "No active trips found matching flight number.", "flight_number": request.flight_number}
        
    triggered_trips = []
    for trip in trips:
        sim_status = get_running_simulation(trip.id)
        if sim_status["is_running"]:
            continue
            
        background_tasks.add_task(
            run_disruption_simulation,
            trip_id=trip.id,
            event_type=request.event_type,
            reason=request.reason,
            delay_hours=request.delay_hours
        )
        triggered_trips.append(trip.id)
        
    return {
        "message": f"Webhook received. Triggered auto-rebooking for {len(triggered_trips)} trip(s).",
        "flight_number": request.flight_number,
        "triggered_trip_ids": triggered_trips
    }


@app.post("/api/trips/{trip_id}/confirm")
def confirm_trip_rebooking(
    trip_id: str,
    session: Session = Depends(get_session)
):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    trip.status = "RESOLVED"
    session.add(trip)
    session.commit()
    return {"message": f"Trip {trip_id} rebooking has been confirmed and resolved.", "trip_id": trip_id, "status": "RESOLVED"}


