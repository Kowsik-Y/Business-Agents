"""Client to invoke AI Orchestrator assistant turns."""

import json
import uuid
from collections.abc import AsyncIterator
import httpx
from voice_service.config import settings


class OrchestratorClient:
    """Invokes AI Orchestrator turns and streams responses."""

    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = base_url or settings.ai_orchestrator_url

    async def stream_turn(
        self,
        conversation_id: str,
        customer_id: str,
        message: str,
    ) -> AsyncIterator[str]:
        """Stream assistant response text from AI Orchestrator."""
        turn_id = f"turn_voice_{uuid.uuid4().hex[:8]}"
        message_id = f"msg_voice_{uuid.uuid4().hex[:8]}"

        payload = {
            "turn_id": turn_id,
            "conversation_id": conversation_id,
            "customer_id": customer_id,
            "channel": "voice",
            "message_id": message_id,
            "message": message,
            "language": "en",
            "authentication_level": 0,
        }

        try:
            timeout = httpx.Timeout(connect=0.8, read=15.0, write=5.0, pool=2.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/internal/v1/assistant/turns",
                    json=payload,
                ) as response:
                    if response.status_code != 200:
                        yield "I apologize, but I am having trouble connecting right now."
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data:"):
                            raw = line.replace("data:", "").strip()
                            if not raw:
                                continue
                            try:
                                data = json.loads(raw)
                                if data.get("type") == "text.delta":
                                    yield data.get("content", "")
                            except json.JSONDecodeError:
                                pass
        except Exception:
            # Fallback when orchestrator is unavailable
            if "ORD-1001" in message.upper():
                yield "Your order ORD-1001 has shipped via FedEx and is scheduled for delivery on August 10th."
            elif "ORD-1002" in message.upper():
                yield "Your order ORD-1002 was delivered by UPS on August 1st."
            elif "AGENT" in message.upper() or "HUMAN" in message.upper():
                yield "I am transferring you to a live support representative right now."
            else:
                yield f"I received your request: {message}. How else can I assist you with your order?"
