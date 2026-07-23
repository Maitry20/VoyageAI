from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.nodes import (
    supervisor_node,
    flight_monitoring_node,
    disruption_detection_node,
    preference_node,
    flight_rebooking_node,
    travel_policy_node,
    hotel_management_node,
    transportation_node,
    notification_node,
    audit_node
)

workflow = StateGraph(AgentState)

# Add all agent nodes
workflow.add_node("Supervisor", supervisor_node)
workflow.add_node("Flight Monitoring", flight_monitoring_node)
workflow.add_node("Disruption Detection", disruption_detection_node)
workflow.add_node("Preference", preference_node)
workflow.add_node("Flight Rebooking", flight_rebooking_node)
workflow.add_node("Travel Policy", travel_policy_node)
workflow.add_node("Hotel Management", hotel_management_node)
workflow.add_node("Transportation", transportation_node)
workflow.add_node("Notification", notification_node)
workflow.add_node("Audit", audit_node)

# Set entry point
workflow.set_entry_point("Supervisor")

def route(state: AgentState) -> str:
    return state.get("next_agent", "END")

# Define conditional edges from Supervisor
workflow.add_conditional_edges(
    "Supervisor",
    route,
    {
        "Flight Monitoring": "Flight Monitoring",
        "Disruption Detection": "Disruption Detection",
        "Preference": "Preference",
        "Flight Rebooking": "Flight Rebooking",
        "Hotel Management": "Hotel Management",
        "Transportation": "Transportation",
        "Travel Policy": "Travel Policy",
        "Notification": "Notification",
        "Audit": "Audit",
        "END": END
    }
)

# All specialized agents route back to Supervisor for next assessment
workflow.add_edge("Flight Monitoring", "Supervisor")
workflow.add_edge("Disruption Detection", "Supervisor")
workflow.add_edge("Preference", "Supervisor")
workflow.add_edge("Flight Rebooking", "Supervisor")
workflow.add_edge("Hotel Management", "Supervisor")
workflow.add_edge("Transportation", "Supervisor")
workflow.add_edge("Travel Policy", "Supervisor")
workflow.add_edge("Notification", "Supervisor")
workflow.add_edge("Audit", "Supervisor")

# Compile the LangGraph application
compiled_graph = workflow.compile()
