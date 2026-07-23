from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import List, Dict, Any

class FlightSearchAdapter(ABC):
    @abstractmethod
    def search_flights(self, origin: str, destination: str, date: datetime) -> List[Dict[str, Any]]:
        """
        Search for flights. Returns list of dicts with keys:
        - id: str
        - flight_number: str
        - origin: str
        - destination: str
        - departure_time: datetime
        - price: float
        - airline: str
        """
        pass

class MockFlightSearchAdapter(FlightSearchAdapter):
    def search_flights(self, origin: str, destination: str, date: datetime) -> List[Dict[str, Any]]:
        # Generate three mock flight options
        airlines = ["Delta Air Lines", "American Airlines", "United Airlines", "Amex Charter"]
        options = []
        
        # Flight 1: Preferred choice, slightly higher price
        options.append({
            "id": f"FL-{origin}-{destination}-001",
            "flight_number": f"DL-{100 + hash(origin) % 900}",
            "origin": origin,
            "destination": destination,
            "departure_time": date + timedelta(hours=2),
            "price": 350.0,
            "airline": airlines[0]
        })
        
        # Flight 2: Budget choice, weird times
        options.append({
            "id": f"FL-{origin}-{destination}-002",
            "flight_number": f"AA-{100 + hash(destination) % 900}",
            "origin": origin,
            "destination": destination,
            "departure_time": date + timedelta(hours=6),
            "price": 220.0,
            "airline": airlines[1]
        })

        # Flight 3: Expensive premium choice
        options.append({
            "id": f"FL-{origin}-{destination}-003",
            "flight_number": f"UA-{100 + hash(origin + destination) % 900}",
            "origin": origin,
            "destination": destination,
            "departure_time": date + timedelta(hours=1, minutes=30),
            "price": 580.0,
            "airline": airlines[2]
        })

        return options
