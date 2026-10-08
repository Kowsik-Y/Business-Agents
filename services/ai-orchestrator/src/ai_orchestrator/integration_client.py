"""Integration Service async HTTP client.
@see docs/11-integration-service.md
"""

from typing import Any
import httpx
from ai_contracts.models import OrderStatus
from ai_orchestrator.config import settings


class IntegrationServiceClient:
    """Client for querying canonical data from Integration Service."""

    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = base_url or settings.integration_service_url

    async def get_order_status(
        self, order_id: str, correlation_id: str | None = None
    ) -> OrderStatus | None:
        """Fetch order status by order ID."""
        headers = {}
        if correlation_id:
            headers["X-Correlation-ID"] = correlation_id

        url = f"{self.base_url}/internal/v1/orders/{order_id}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    return OrderStatus(
                        order_id=data["orderId"],
                        status=data["status"],
                        carrier=data.get("carrier"),
                        tracking_number=data.get("trackingNumber"),
                        estimated_delivery=data.get("estimatedDelivery"),
                        shipped_at=data.get("shippedAt"),
                        delivered_at=data.get("deliveredAt"),
                    )
                return None
            except Exception:
                return None

    async def list_customer_orders(
        self, customer_id: str, correlation_id: str | None = None
    ) -> list[OrderStatus]:
        """Fetch all orders for a customer ID."""
        headers = {}
        if correlation_id:
            headers["X-Correlation-ID"] = correlation_id

        url = f"{self.base_url}/internal/v1/orders"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    url, params={"customerId": customer_id}, headers=headers
                )
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        return [
                            OrderStatus(
                                order_id=item["orderId"],
                                status=item["status"],
                                carrier=item.get("carrier"),
                                tracking_number=item.get("trackingNumber"),
                                estimated_delivery=item.get("estimatedDelivery"),
                                shipped_at=item.get("shippedAt"),
                                delivered_at=item.get("deliveredAt"),
                            )
                            for item in data
                        ]
                return []
            except Exception:
                return []

    async def get_customer_subscription(
        self, customer_id: str, correlation_id: str | None = None
    ) -> dict[str, Any] | None:
        """Fetch canonical subscription details for a customer ID."""
        headers = {}
        if correlation_id:
            headers["X-Correlation-ID"] = correlation_id

        url = f"{self.base_url}/internal/v1/subscriptions"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    url, params={"customerId": customer_id}, headers=headers
                )
                if response.status_code == 200:
                    return response.json()
                return None
            except Exception:
                return None

    async def check_warranty_eligibility(
        self, customer_id: str, correlation_id: str | None = None
    ) -> dict[str, Any] | None:
        """Check hardware warranty & RMA eligibility for a customer ID."""
        headers = {}
        if correlation_id:
            headers["X-Correlation-ID"] = correlation_id

        url = f"{self.base_url}/internal/v1/warranties/eligibility"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    url, params={"customerId": customer_id}, headers=headers
                )
                if response.status_code == 200:
                    return response.json()
                return None
            except Exception:
                return None

    async def check_device_telemetry(
        self, customer_id: str, correlation_id: str | None = None
    ) -> dict[str, Any] | None:
        """Fetch device telemetry and diagnostic status for a customer ID."""
        headers = {}
        if correlation_id:
            headers["X-Correlation-ID"] = correlation_id

        url = f"{self.base_url}/internal/v1/devices/telemetry"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    url, params={"customerId": customer_id}, headers=headers
                )
                if response.status_code == 200:
                    return response.json()
                return None
            except Exception:
                return None

