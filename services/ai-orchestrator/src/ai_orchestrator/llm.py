"""Live LLM invocation client using OpenAI-compatible API."""

import json
import httpx
from ai_orchestrator.config import settings


async def generate_chat_response(
    messages: list[dict[str, str]],
    system_prompt: str | None = None,
    temperature: float = 0.3,
) -> str | None:
    """Invoke live OpenAI-compatible chat completion."""
    if settings.mock_llm or not settings.openai_api_key:
        return None

    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{settings.openai_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openai_model,
                    "messages": full_messages,
                    "temperature": temperature,
                },
            )
            if response.status_code == 200:
                data = response.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "").strip()
    except Exception:
        pass

    return None
