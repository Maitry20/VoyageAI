from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any

class TransportSearchAdapter(ABC):
    @abstractmethod
    def search_transportation(self, origin: str, destination: str, date: datetime) -> List[Dict[str, Any]]:
        """
        Search for transportation options. Returns list of dicts with keys:
        - id: str
        - type: str (Uber, Shuttle, Taxi, Train)
        - name: str
        - price: float
        - duration_minutes: int
        """
        pass

class MockTransportSearchAdapter(TransportSearchAdapter):
    def search_transportation(self, origin: str, destination: str, date: datetime) -> List[Dict[str, Any]]:
        return [
            {
                "id": f"TR-{origin}-{destination}-001",
                "type": "Uber",
                "name": "Uber Black Voucher (Amex Preferred)",
                "price": 45.0,
                "duration_minutes": 25
            },
            {
                "id": f"TR-{origin}-{destination}-002",
                "type": "Shuttle",
                "name": "Complimentary Hotel Shuttle Bus",
                "price": 0.0,
                "duration_minutes": 40
            },
            {
                "id": f"TR-{origin}-{destination}-003",
                "type": "Taxi",
                "name": "Local Airport Yellow Cab",
                "price": 35.0,
                "duration_minutes": 30
            }
        ]
