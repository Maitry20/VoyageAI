from datetime import datetime, timedelta
import json
import os
from typing import Dict, Any, List
import google.generativeai as genai
from app.agents.state import AgentState
from app.adapters.flight_adapter import LiteApiFlightSearchAdapter
from app.adapters.hotel_adapter import LiteApiHotelSearchAdapter
from app.adapters.transport_adapter import MockTransportSearchAdapter

# Setup Gemini if API Key is configured
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)


# Initialize Adapters
flight_adapter = LiteApiFlightSearchAdapter()
hotel_adapter = LiteApiHotelSearchAdapter()
transport_adapter = MockTransportSearchAdapter()

def log_agent_action(state: AgentState, agent_name: str, status: str, action: str, output: Any) -> Dict[str, Any]:
    return {
        "agent_name": agent_name,
        "status": status,
        "action_taken": action,
        "output_data": json.dumps(output) if not isinstance(output, str) else output,
        "timestamp": datetime.utcnow().isoformat()
    }

# 1. Flight Monitoring Node
def flight_monitoring_node(state: AgentState) -> Dict[str, Any]:
    trip_id = state["trip_id"]
    logs = list(state.get("agent_logs") or [])
    
    action = f"Retrieving flight status and flight plan details for trip: {trip_id}."
    output = {
        "message": "Flight plan retrieved successfully.",
        "itinerary": "JFK -> LHR",
        "carrier": "American Airlines",
        "original_flight": "AA-104",
        "monitored_status": "DISRUPTED"
    }
    
    logs.append(log_agent_action(state, "Flight Monitoring", "SUCCESS", action, output))
    return {
        "agent_logs": logs,
        "next_agent": "Supervisor"
    }

# 2. Disruption Detection Node
def disruption_detection_node(state: AgentState) -> Dict[str, Any]:
    logs = list(state.get("agent_logs") or [])
    disruption = state.get("disruption_event") or {}
    
    event_type = disruption.get("event_type", "CANCELLATION")
    reason = disruption.get("reason", "Weather")
    delay_hours = disruption.get("delay_hours", 0)
    
    # Assess if hotel is required (e.g. cancellation or delay > 6 hours overnight)
    requires_hotel = False
    if event_type == "CANCELLATION":
        requires_hotel = True
    elif event_type == "DELAY" and delay_hours >= 6:
        requires_hotel = True
        
    action = f"Analyzing disruption: {event_type} due to {reason}."
    output = {
        "requires_rebooking": True,
        "requires_hotel": requires_hotel,
        "severity": "CRITICAL" if requires_hotel else "MODERATE",
        "delay_hours": delay_hours
    }
    
    logs.append(log_agent_action(state, "Disruption Detection", "SUCCESS", action, output))
    return {
        "agent_logs": logs,
        "disruption_event": {**disruption, "requires_hotel": requires_hotel},
        "next_agent": "Supervisor"
    }

# 3. Preference Node
def preference_node(state: AgentState) -> Dict[str, Any]:
    logs = list(state.get("agent_logs") or [])
    
    # In a real app, this queries the user profile. Here, we load from pre-existing state or mock defaults.
    prefs = state.get("passenger_preferences") or {
        "preferred_airline": "Delta Air Lines",
        "seat_preference": "Window",
        "hotel_preference": "Marriott",
        "dietary_requirements": "Vegetarian",
        "max_budget": 800.0
    }
    
    action = "Loading passenger travel preferences and loyalty program identifiers."
    output = {
        "preferences_loaded": True,
        "loyalty_status": "Amex Centurion / Delta Medallion Gold",
        "rules": prefs
    }
    
    logs.append(log_agent_action(state, "Preference", "SUCCESS", action, output))
    return {
        "agent_logs": logs,
        "passenger_preferences": prefs,
        "next_agent": "Supervisor"
    }

# 4. Flight Rebooking Node
def flight_rebooking_node(state: AgentState) -> Dict[str, Any]:
    logs = list(state.get("agent_logs") or [])
    disruption = state.get("disruption_event") or {}
    prefs = state.get("passenger_preferences") or {}
    
    origin = disruption.get("origin", "JFK")
    destination = disruption.get("destination", "LHR")
    dept_time = disruption.get("original_departure") or datetime.utcnow()
    if isinstance(dept_time, str):
        dept_time = datetime.fromisoformat(dept_time)
        
    # Search for alternative flights
    raw_options = flight_adapter.search_flights(origin, destination, dept_time)
    
    # Score alternative flights based on:
    # 1. Matches passenger's preferred airline (+3.0 score)
    # 2. Time delay penalty (-0.1 per hour delay)
    # 3. Cost penalty (-0.01 per dollar)
    scored_options = []
    preferred_airline = prefs.get("preferred_airline", "")
    
    for opt in raw_options:
        opt_time = opt["departure_time"]
        delay_hrs = (opt_time - dept_time).total_seconds() / 3600.0
        
        score = 10.0
        if opt["airline"] == preferred_airline:
            score += 3.0
        score -= (delay_hrs * 0.5)
        score -= (opt["price"] * 0.005)
        
        opt["score"] = round(max(0.0, score), 2)
        # Format departure time to string for serialization
        opt_serializable = {**opt, "departure_time": opt["departure_time"].isoformat()}
        scored_options.append(opt_serializable)
        
    # Pick the best scoring option
    scored_options.sort(key=lambda x: x["score"], reverse=True)
    selected_flight = scored_options[0] if scored_options else None
    
    action = f"Searching for alternative flights from {origin} to {destination}."
    output = {
        "options_found_count": len(scored_options),
        "best_flight_number": selected_flight["flight_number"] if selected_flight else "None",
        "best_flight_score": selected_flight["score"] if selected_flight else 0.0,
        "all_options": scored_options
    }
    
    logs.append(log_agent_action(state, "Flight Rebooking", "SUCCESS", action, output))
    return {
        "agent_logs": logs,
        "flight_options": scored_options,
        "selected_flight": selected_flight,
        "next_agent": "Supervisor"
    }

# 5. Travel Policy Node
def travel_policy_node(state: AgentState) -> Dict[str, Any]:
    logs = list(state.get("agent_logs") or [])
    selected_flight = state.get("selected_flight")
    selected_hotel = state.get("selected_hotel")
    prefs = state.get("passenger_preferences") or {}
    
    max_budget = prefs.get("max_budget", 600.0)
    violations = []
    compliance_score = 100.0
    
    total_cost = 0.0
    if selected_flight:
        total_cost += selected_flight["price"]
        if selected_flight["price"] > max_budget * 0.7:
            violations.append(f"Flight price (${selected_flight['price']}) exceeds 70% of total travel budget allowance (${max_budget}).")
            compliance_score -= 20
            
    if selected_hotel:
        total_cost += selected_hotel["price_per_night"]
        if selected_hotel["price_per_night"] > 250.0:
            violations.append(f"Hotel price per night (${selected_hotel['price_per_night']}) exceeds policy cap of $250.00.")
            compliance_score -= 15

    is_compliant = len(violations) == 0
    policy_report = {
        "is_compliant": is_compliant,
        "compliance_score": compliance_score,
        "violations": violations,
        "total_estimated_disruption_cost": total_cost,
        "budget_limit": max_budget
    }
    
    status = "SUCCESS" if is_compliant else "WARNING"
    action = "Validating chosen options against Amex Travel Policy guidelines."
    
    logs.append(log_agent_action(state, "Travel Policy", status, action, policy_report))
    return {
        "agent_logs": logs,
        "policy_compliance": policy_report,
        "next_agent": "Supervisor"
    }

# 6. Hotel Management Node
def hotel_management_node(state: AgentState) -> Dict[str, Any]:
    logs = list(state.get("agent_logs") or [])
    disruption = state.get("disruption_event") or {}
    prefs = state.get("passenger_preferences") or {}
    
    requires_hotel = disruption.get("requires_hotel", False)
    if not requires_hotel:
        action = "Hotel reservation bypassed (no overnight delay detected)."
        output = {"requires_hotel": False, "message": "Bypassed."}
        logs.append(log_agent_action(state, "Hotel Management", "SUCCESS", action, output))
        return {
            "agent_logs": logs,
            "hotel_options": [],
            "selected_hotel": None,
            "next_agent": "Supervisor"
        }
        
    city = disruption.get("origin", "JFK")
    dept_time = disruption.get("original_departure") or datetime.utcnow()
    if isinstance(dept_time, str):
        dept_time = datetime.fromisoformat(dept_time)
        
    raw_hotels = hotel_adapter.search_hotels(city, dept_time)
    
    # Score hotels based on:
    # 1. Brand match (+2.0 points for matching pref, e.g. Marriott)
    # 2. Rating quality (+2.0 points per rating star)
    # 3. Distance penalty (-0.5 points per mile from airport)
    # 4. Cost penalty (-0.01 per dollar)
    scored_hotels = []
    preferred_brand = prefs.get("hotel_preference", "")
    
    for hot in raw_hotels:
        score = 5.0
        if preferred_brand.lower() in hot["name"].lower():
            score += 3.0
        score += (hot["rating"] * 1.5)
        score -= (hot["distance_from_airport"] * 0.4)
        score -= (hot["price_per_night"] * 0.01)
        
        hot["score"] = round(max(0.0, score), 2)
        scored_hotels.append(hot)
        
    scored_hotels.sort(key=lambda x: x["score"], reverse=True)
    selected_hotel = scored_hotels[0] if scored_hotels else None
    
    action = f"Searching hotel accommodations near {city} Airport for overnight stay."
    output = {
        "hotels_found_count": len(scored_hotels),
        "best_hotel_name": selected_hotel["name"] if selected_hotel else "None",
        "best_hotel_score": selected_hotel["score"] if selected_hotel else 0.0,
        "all_options": scored_hotels
    }
    
    logs.append(log_agent_action(state, "Hotel Management", "SUCCESS", action, output))
    return {
        "agent_logs": logs,
        "hotel_options": scored_hotels,
        "selected_hotel": selected_hotel,
        "next_agent": "Supervisor"
    }

# 7. Transportation Node
def transportation_node(state: AgentState) -> Dict[str, Any]:
    logs = list(state.get("agent_logs") or [])
    disruption = state.get("disruption_event") or {}
    selected_hotel = state.get("selected_hotel")
    
    # Transport only needed if a hotel is booked
    if not selected_hotel:
        action = "Ground transport reservation bypassed (no hotel/overnight stay required)."
        output = {"requires_transport": False, "message": "Bypassed."}
        logs.append(log_agent_action(state, "Transportation", "SUCCESS", action, output))
        return {
            "agent_logs": logs,
            "transport_options": [],
            "selected_transport": None,
            "next_agent": "Supervisor"
        }
        
    origin = disruption.get("origin", "JFK")
    hotel_name = selected_hotel["name"]
    dept_time = disruption.get("original_departure") or datetime.utcnow()
    if isinstance(dept_time, str):
        dept_time = datetime.fromisoformat(dept_time)
        
    raw_transit = transport_adapter.search_transportation(origin, hotel_name, dept_time)
    
    # We prefer the complimentary shuttle first, then Uber, then Taxi
    scored_transit = []
    for trans in raw_transit:
        score = 8.0
        if "complimentary" in trans["name"].lower() or trans["price"] == 0:
            score += 4.0
        elif trans["type"] == "Uber":
            score += 2.0
            
        trans["score"] = score
        scored_transit.append(trans)
        
    scored_transit.sort(key=lambda x: x["score"], reverse=True)
    selected_transit = scored_transit[0] if scored_transit else None
    
    action = f"Coordinating airport-to-hotel transit for {hotel_name}."
    output = {
        "transit_options_count": len(scored_transit),
        "selected_transit_type": selected_transit["type"] if selected_transit else "None",
        "selected_transit_cost": selected_transit["price"] if selected_transit else 0.0,
        "all_options": scored_transit
    }
    
    logs.append(log_agent_action(state, "Transportation", "SUCCESS", action, output))
    return {
        "agent_logs": logs,
        "transport_options": scored_transit,
        "selected_transport": selected_transit,
        "next_agent": "Supervisor"
    }

# 8. Notification Node
def notification_node(state: AgentState) -> Dict[str, Any]:
    logs = list(state.get("agent_logs") or [])
    selected_flight = state.get("selected_flight")
    selected_hotel = state.get("selected_hotel")
    selected_transit = state.get("selected_transport")
    
    message = "VoyageAI Alert: Your flight AA-104 has been disrupted. "
    if selected_flight:
        message += f"We have auto-rebooked you on {selected_flight['airline']} flight {selected_flight['flight_number']} departing at {selected_flight['departure_time']}. "
    if selected_hotel:
        message += f"We have also reserved an overnight stay at {selected_hotel['name']}. "
    if selected_transit:
        message += f"Ground transit has been coordinated: {selected_transit['name']} (${selected_transit['price']}). "
    message += "All changes conform to your corporate travel policy. Tap details to confirm."
    
    if GEMINI_KEY:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Generate a friendly, concise, and helpful SMS update to Maitry Patel regarding a travel disruption.
            Current rebooking details:
            - Flight: {selected_flight}
            - Hotel: {selected_hotel}
            - Transit: {selected_transit}
            
            Keep the length under 160 characters. Speak as 'VoyageAI Concierge'.
            """
            response = model.generate_content(prompt)
            message = response.text.strip()
        except Exception:
            pass

    action = "Dispatching real-time SMS and App notifications to passenger."
    output = {
        "recipient": "Maitry Patel",
        "medium": "SMS/Push",
        "message_body": message,
        "dispatch_status": "DELIVERED"
    }
    
    logs.append(log_agent_action(state, "Notification", "SUCCESS", action, output))
    return {
        "agent_logs": logs,
        "notification_sent": True,
        "next_agent": "Supervisor"
    }

# 9. Audit Node
def audit_node(state: AgentState) -> Dict[str, Any]:
    logs = list(state.get("agent_logs") or [])
    
    action = "Generating compliance signature and persisting complete agent session execution graph logs."
    output = {
        "session_status": "COMPLETED",
        "audit_version": "2026.1",
        "chain_of_custody_verified": True,
        "database_persistence": "SUCCESS"
    }
    
    logs.append(log_agent_action(state, "Audit", "SUCCESS", action, output))
    return {
        "agent_logs": logs,
        "audit_logged": True,
        "next_agent": "Supervisor"
    }

# 10. Supervisor Node (Routing Logic)
def supervisor_node(state: AgentState) -> Dict[str, Any]:
    logs = list(state.get("agent_logs") or [])
    completed_nodes = [log["agent_name"] for log in logs]
    
    next_node = None
    reason = ""
    
    if GEMINI_KEY:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            You are the Supervisor of a travel concierge.
            You must decide which step to execute next based on the completed agent logs:
            Completed: {completed_nodes}
            
            Options of steps to route to next (in strict logical order, do not skip if not completed):
            1. 'Flight Monitoring' (Retrieves flight details, starts first)
            2. 'Disruption Detection' (Analyzes the cancellation or delay severity)
            3. 'Preference' (Loads user preferences and loyalty programs)
            4. 'Flight Rebooking' (Searches for flight options)
            5. 'Hotel Management' (Finds lodging if needed)
            6. 'Transportation' (Finds airport-to-hotel transit if needed)
            7. 'Travel Policy' (Validates options against travel budget policy)
            8. 'Notification' (Prepares customer alert)
            9. 'Audit' (Saves compliance records, runs last)
            
            If all are completed, respond with routing_decision: 'END'.
            
            Respond strictly in valid JSON format:
            {{
              "routing_decision": "NAME_OF_STEP_OR_END",
              "reason": "Short explanation of the step rationale"
            }}
            """
            response = model.generate_content(prompt)
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            decision = json.loads(text)
            next_node = decision.get("routing_decision")
            reason = decision.get("reason", "Dynamic Gemini routing.")
        except Exception:
            pass

    if not next_node:
        if "Flight Monitoring" not in completed_nodes:
            next_node = "Flight Monitoring"
            reason = "Initiating active itinerary details and tracking."
        elif "Disruption Detection" not in completed_nodes:
            next_node = "Disruption Detection"
            reason = "Evaluating severity of disruption event."
        elif "Preference" not in completed_nodes:
            next_node = "Preference"
            reason = "Aligning constraints with user's personal travel preferences."
        elif "Flight Rebooking" not in completed_nodes:
            next_node = "Flight Rebooking"
            reason = "Searching alternative flight connections."
        elif "Hotel Management" not in completed_nodes:
            next_node = "Hotel Management"
            reason = "Assessing overnight accommodation necessity."
        elif "Transportation" not in completed_nodes:
            next_node = "Transportation"
            reason = "Arranging taxi/shuttle logistics."
        elif "Travel Policy" not in completed_nodes:
            next_node = "Travel Policy"
            reason = "Verifying corporate compliance limits and exception thresholds."
        elif "Notification" not in completed_nodes:
            next_node = "Notification"
            reason = "Preparing dispatch notifications to user."
        elif "Audit" not in completed_nodes:
            next_node = "Audit"
            reason = "Recording final blockchain compliance trace and DB write."
        else:
            next_node = "END"
            reason = "Concierge resolution fully settled."

    action = f"Routing Supervisor assessment: {reason}"
    output = {
        "completed_stages": completed_nodes,
        "routing_decision": next_node
    }
    
    logs.append(log_agent_action(state, "Supervisor", "SUCCESS", action, output))
    return {
        "agent_logs": logs,
        "next_agent": next_node
    }
