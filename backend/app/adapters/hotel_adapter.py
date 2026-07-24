from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any

class HotelSearchAdapter(ABC):
    @abstractmethod
    def search_hotels(self, city: str, date: datetime) -> List[Dict[str, Any]]:
        """
        Search for hotels in a city. Returns list of dicts with keys:
        - id: str
        - name: str
        - price_per_night: float
        - rating: float
        - distance_from_airport: float
        """
        pass

class MockHotelSearchAdapter(HotelSearchAdapter):
    def search_hotels(self, city: str, date: datetime) -> List[Dict[str, Any]]:
        # Generate three mock hotels
        return [
            {
                "id": f"HT-{city}-001",
                "name": f"Marriott Elite {city} Airport",
                "price_per_night": 185.0,
                "rating": 4.5,
                "distance_from_airport": 1.2
            },
            {
                "id": f"HT-{city}-002",
                "name": f"Hilton Garden Inn {city} Downtown",
                "price_per_night": 240.0,
                "rating": 4.7,
                "distance_from_airport": 8.5
            },
            {
                "id": f"HT-{city}-003",
                "name": f"Budget Comfort Inn {city}",
                "price_per_night": 95.0,
                "rating": 3.8,
                "distance_from_airport": 4.1
            }
        ]


class LiteApiHotelSearchAdapter(HotelSearchAdapter):
    def __init__(self, api_key: str = None):
        import os
        self.api_key = api_key or os.environ.get("LITEAPI_API_KEY")

    def _get_retry_decorator(self):
        from tenacity import retry, stop_after_attempt, wait_exponential
        return retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))

    def search_hotels(self, city: str, date: datetime) -> List[Dict[str, Any]]:
        import logging
        import requests
        from datetime import timedelta
        logger = logging.getLogger(__name__)
        
        if not self.api_key:
            logger.warning("LiteApi API Key not found. Falling back to Mock Hotel Search.")
            return MockHotelSearchAdapter().search_hotels(city, date)
            
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "X-API-Key": self.api_key
        }
        
        checkin_str = date.strftime("%Y-%m-%d")
        checkout_str = (date + timedelta(days=1)).strftime("%Y-%m-%d")
        
        city_mapping = {
            "JFK": {"city": "New York", "country": "US"},
            "LHR": {"city": "London", "country": "GB"},
            "LAX": {"city": "Los Angeles", "country": "US"},
            "SFO": {"city": "San Francisco", "country": "US"},
            "HNL": {"city": "Honolulu", "country": "US"}
        }
        mapped = city_mapping.get(city.upper(), {"city": city, "country": "US"})
        
        payload = {
            "cityName": mapped["city"],
            "countryCode": mapped["country"],
            "occupancies": [
                {
                    "adults": 1
                }
            ],
            "currency": "USD",
            "guestNationality": "US",
            "checkin": checkin_str,
            "checkout": checkout_str,
            "roomMapping": True,
            "includeHotelData": True
        }
        
        # Inner function decorated with tenacity retry to execute HTTP post
        retry_decorator = self._get_retry_decorator()
        
        @retry_decorator
        def execute_request():
            url = "https://api.liteapi.travel/v3.0/hotels/rates"
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            if resp.status_code != 200:
                raise requests.exceptions.HTTPError(f"HTTP {resp.status_code}: {resp.text}")
            return resp
            
        try:
            response = execute_request()
            res_data = response.json()
            hotels_data = res_data.get("data", [])
            options = []
            for hotel in hotels_data:
                hotel_name = hotel.get("hotelName", "LiteApi Partner Hotel")
                hotel_id = hotel.get("hotelId")
                
                price = 150.0
                rooms = hotel.get("rooms", [])
                if rooms:
                    rates = rooms[0].get("rates", [])
                    if rates:
                        price = float(rates[0].get("price", 150.0))
                        
                rating = float(hotel.get("rating", 4.0))
                distance = 3.5
                
                options.append({
                    "id": hotel_id or f"HT-{city}-{len(options)+1}",
                    "name": hotel_name,
                    "price_per_night": price,
                    "rating": rating,
                    "distance_from_airport": distance
                })
                
            if options:
                return options[:5]
                
        except Exception as e:
            logger.exception("Error searching hotels with LiteAPI (all retry attempts failed)")
            
        logger.info("Falling back to Mock Hotel Search due to API error/empty results.")
        return MockHotelSearchAdapter().search_hotels(city, date)

