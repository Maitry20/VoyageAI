import asyncio
from sqlmodel import Session, select
from app.database import create_db_and_tables, engine
from app.models import Trip
from app.services.simulation import populate_mock_data, run_disruption_simulation, get_running_simulation

async def test_run():
    print("Initializing Database...")
    create_db_and_tables()
    
    print("Populating default trips...")
    populate_mock_data()
    
    with Session(engine) as session:
        trips = session.exec(select(Trip)).all()
        print(f"Loaded {len(trips)} trips from database:")
        for t in trips:
            print(f" - {t.id}: {t.passenger_name} ({t.flight_number})")
            
    print("\nStarting Disruption Simulation for trip-001...")
    # Trigger cancellation disruption
    await run_disruption_simulation(
        trip_id="trip-001",
        event_type="CANCELLATION",
        reason="Heavy snowfall at JFK Airport",
        delay_hours=0
    )
    
    print("Simulation complete! Querying audit logs...")
    from app.models import AgentAuditLog
    with Session(engine) as session:
        logs = session.exec(select(AgentAuditLog).where(AgentAuditLog.trip_id == "trip-001")).all()
        print(f"Found {len(logs)} audit logs:")
        for l in logs:
            print(f"[{l.timestamp.strftime('%H:%M:%S')}] {l.agent_name} -> {l.status} - {l.action_taken}")

if __name__ == "__main__":
    asyncio.run(test_run())
