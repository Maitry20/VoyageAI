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
