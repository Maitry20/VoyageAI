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


class LiteApiFlightSearchAdapter(FlightSearchAdapter):
    def __init__(self, api_key: str = None):
        import os
        self.api_key = api_key or os.environ.get("LITEAPI_API_KEY")

    def _get_retry_decorator(self):
        from tenacity import retry, stop_after_attempt, wait_exponential
        return retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))

    def search_flights(self, origin: str, destination: str, date: datetime) -> List[Dict[str, Any]]:
        import logging
        import requests
        logger = logging.getLogger(__name__)
        
        if not self.api_key:
            logger.warning("LiteApi API Key not found. Falling back to Mock Flight Search.")
            return MockFlightSearchAdapter().search_flights(origin, destination, date)
        
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "X-API-Key": self.api_key
        }
        
        dep_date_str = date.strftime("%Y-%m-%d")
        payload = {
            "legs": [
                {
                    "origin": origin,
                    "destination": destination,
                    "departureDate": dep_date_str
                }
            ],
            "passengers": {
                "adults": 1,
                "children": 0,
                "infants": 0
            },
            "cabinClass": "economy"
        }
        
        # Inner function decorated with tenacity retry to execute HTTP post
        retry_decorator = self._get_retry_decorator()
        
        @retry_decorator
        def execute_request():
            url = "https://api.liteapi.travel/v3.0/flights/search"
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            if resp.status_code != 200:
                raise requests.exceptions.HTTPError(f"HTTP {resp.status_code}: {resp.text}")
            return resp
            
        try:
            response = execute_request()
            res_data = response.json()
            journeys = res_data.get("data", {}).get("journeys", [])
            options = []
            for journey in journeys:
                offers = journey.get("offers", [])
                for idx, offer in enumerate(offers):
                    offer_id = offer.get("offerId")
                    price = float(offer.get("price", {}).get("amount", 250.0))
                    
                    airline = offer.get("airlineName", "LiteApi Partner Airline")
                    flight_num = offer.get("flightNumber", f"LA-{100 + idx}")
                    
                    options.append({
                        "id": offer_id or f"FL-{origin}-{destination}-{idx}",
                        "flight_number": flight_num,
                        "origin": origin,
                        "destination": destination,
                        "departure_time": date + timedelta(hours=2 + idx * 3),
                        "price": price,
                        "airline": airline
                    })
            
            if options:
                return options
                
        except Exception as e:
            logger.exception("Error searching flights with LiteAPI (all retry attempts failed)")
            
        logger.info("Falling back to Mock Flight Search due to API error/empty results.")
        return MockFlightSearchAdapter().search_flights(origin, destination, date)

