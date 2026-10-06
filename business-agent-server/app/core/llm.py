"""
Unified LLM Client Layer.
Supports:
1. "openai" - OpenAI Chat Completions API with Function Calling.
2. "simulator" - Deterministic, offline agent reasoning simulator for zero-cost workshop development.
3. Fallback routing if API keys are missing.
"""

import json
import logging
import re
from typing import Any, AsyncGenerator, Dict, List, Optional
from pydantic import BaseModel

from app.config import settings
from app.core.state import ChatMessage

logger = logging.getLogger(__name__)


class LLMResponse(BaseModel):
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    finish_reason: str = "stop"
    usage: Dict[str, int] = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}


class BaseLLMClient:
    async def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        agent_id: str = "general"
    ) -> LLMResponse:
        raise NotImplementedError

    async def stream_chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        agent_id: str = "general"
    ) -> AsyncGenerator[str, None]:
        raise NotImplementedError


class SimulatorLLMClient(BaseLLMClient):
    """
    Intelligent Workshop Simulator:
    Generates realistic reasoning, tool calls, and structured outputs without requiring
    paid third-party API credentials. Perfect for testing, continuous integration, and workshops.
    """
    async def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        agent_id: str = "general"
    ) -> LLMResponse:
        last_message = messages[-1] if messages else None
        last_role = last_message.role if last_message else "user"
        last_content = last_message.content if last_message else ""

        # Check if the last message was a tool execution result
        if last_role == "tool":
            # The agent has received tool results; now formulate the final structured response
            tool_data = {}
            try:
                tool_data = json.loads(last_content)
            except Exception:
                tool_data = {"raw": last_content}

            final_text = self._synthesize_final_response(agent_id, tool_data, messages)
            return LLMResponse(
                content=final_text,
                tool_calls=None,
                finish_reason="stop",
                usage={"prompt_tokens": 120, "completion_tokens": 80, "total_tokens": 200}
            )

        # First turn: inspect user prompt and decide whether to call a tool
        user_prompt = ""
        for m in reversed(messages):
            if m.role == "user":
                user_prompt = m.content
                break

        tool_call = self._decide_tool_call(agent_id, user_prompt, tools)
        if tool_call:
            return LLMResponse(
                content=f"Analyzing request for {agent_id} agent. Invoking required business tool: {tool_call['function']['name']}.",
                tool_calls=[tool_call],
                finish_reason="tool_calls",
                usage={"prompt_tokens": 150, "completion_tokens": 45, "total_tokens": 195}
            )

        # Standard text response without tool call
        default_reply = self._generate_direct_response(agent_id, user_prompt)
        return LLMResponse(
            content=default_reply,
            tool_calls=None,
            finish_reason="stop",
            usage={"prompt_tokens": 100, "completion_tokens": 50, "total_tokens": 150}
        )

    def _decide_tool_call(self, agent_id: str, prompt: str, tools: Optional[List[Dict[str, Any]]]) -> Optional[Dict[str, Any]]:
        if not tools:
            return None

        prompt_lower = prompt.lower()
        tool_names = [t.get("function", {}).get("name") for t in tools]

        if agent_id == "sales" or "sales" in agent_id:
            # Check for email or lead scoring
            email_match = re.search(r'[\w\.-]+@[\w\.-]+', prompt)
            if email_match and "crm_lookup_lead" in tool_names:
                return {
                    "id": "call_crm_001",
                    "type": "function",
                    "function": {
                        "name": "crm_lookup_lead",
                        "arguments": json.dumps({"email": email_match.group(0)})
                    }
                }
            if "score" in prompt_lower and "calculate_lead_score" in tool_names:
                return {
                    "id": "call_score_001",
                    "type": "function",
                    "function": {
                        "name": "calculate_lead_score",
                        "arguments": json.dumps({"company_size": 150, "budget": 60000, "timeline_months": 2, "has_authority": True})
                    }
                }
            if "crm_lookup_lead" in tool_names:
                return {
                    "id": "call_crm_fallback",
                    "type": "function",
                    "function": {
                        "name": "crm_lookup_lead",
                        "arguments": json.dumps({"email": "alex@acmecorp.com"})
                    }
                }

        elif agent_id == "marketing" or "marketing" in agent_id:
            if "analyze_target_channels" in tool_names:
                return {
                    "id": "call_mkt_001",
                    "type": "function",
                    "function": {
                        "name": "analyze_target_channels",
                        "arguments": json.dumps({"industry": "B2B SaaS", "target_audience": "VP of Engineering"})
                    }
                }

        elif agent_id == "analyst" or "analyst" in agent_id:
            if "execute_analytics_sql" in tool_names:
                return {
                    "id": "call_sql_001",
                    "type": "function",
                    "function": {
                        "name": "execute_analytics_sql",
                        "arguments": json.dumps({"query": "SELECT quarter, mrr, growth_rate FROM revenue_metrics ORDER BY quarter ASC;"})
                    }
                }

        elif agent_id == "support" or "support" in agent_id:
            if "search_support_knowledge_base" in tool_names:
                return {
                    "id": "call_kb_001",
                    "type": "function",
                    "function": {
                        "name": "search_support_knowledge_base",
                        "arguments": json.dumps({"query": prompt[:50], "category": "technical"})
                    }
                }

        elif agent_id == "operations" or "operations" in agent_id:
            if "check_service_health" in tool_names:
                return {
                    "id": "call_ops_001",
                    "type": "function",
                    "function": {
                        "name": "check_service_health",
                        "arguments": json.dumps({"service_name": "api-gateway"})
                    }
                }

        return None

    def _synthesize_final_response(self, agent_id: str, tool_data: Dict[str, Any], messages: List[ChatMessage]) -> str:
        if agent_id == "sales":
            return (
                f"### Sales Qualification Assessment\n\n"
                f"Based on CRM records and BANT qualification criteria, this lead represents an enterprise opportunity. "
                f"Details retrieved: {json.dumps(tool_data, indent=2)}\n\n"
                f"**Recommendation**: Schedule an executive discovery call focusing on automated workflow velocity."
            )
        elif agent_id == "marketing":
            return (
                f"### Marketing Campaign Plan\n\n"
                f"Channel analysis completed. Primary recommended channel is LinkedIn (50% budget) followed by Email (30%).\n"
                f"Channel data: {json.dumps(tool_data, indent=2)}\n\n"
                f"**Action**: Proceeding with multi-channel copy deployment targeting high-intent decision makers."
            )
        elif agent_id == "analyst":
            return (
                f"### Data Analytics Report\n\n"
                f"Analysis executed successfully against data warehouse:\n"
                f"{json.dumps(tool_data, indent=2)}\n\n"
                f"**Insight**: Consistent 20%+ quarter-over-quarter expansion driven by enterprise customer renewals."
            )
        elif agent_id == "support":
            return (
                f"### Support Resolution\n\n"
                f"Knowledge base search completed:\n"
                f"{json.dumps(tool_data, indent=2)}\n\n"
                f"**Customer Response**: Thank you for contacting support. You can configure and manage this immediately under Settings > Developer."
            )
        elif agent_id == "operations":
            return (
                f"### Operational Status Report\n\n"
                f"Service inspection completed:\n"
                f"{json.dumps(tool_data, indent=2)}\n\n"
                f"**Status**: All core cluster nodes healthy with p99 latency well within SLA limits."
            )
        return f"Completed tool execution and formulated plan: {json.dumps(tool_data)}"

    def _generate_direct_response(self, agent_id: str, prompt: str) -> str:
        return f"[{agent_id.upper()} AGENT] Processed request: '{prompt}'. System state updated and ready for next instruction."


class OpenAILLMClient(BaseLLMClient):
    """Production OpenAI Client with native tool calling."""
    def __init__(self, api_key: str):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key)

    async def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        agent_id: str = "general"
    ) -> LLMResponse:
        formatted_messages = []
        for m in messages:
            msg_dict: Dict[str, Any] = {"role": m.role, "content": m.content}
            if m.name:
                msg_dict["name"] = m.name
            if m.tool_call_id:
                msg_dict["tool_call_id"] = m.tool_call_id
            if m.tool_calls:
                msg_dict["tool_calls"] = m.tool_calls
            formatted_messages.append(msg_dict)

        kwargs: Dict[str, Any] = {
            "model": settings.DEFAULT_MODEL_NAME,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": settings.MAX_TOKENS
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = await self.client.chat.completions.create(**kwargs)
        choice = response.choices[0]
        msg = choice.message

        tool_calls = None
        if msg.tool_calls:
            tool_calls = [
                {
                    "id": tc.id,
                    "type": tc.type,
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                }
                for tc in msg.tool_calls
            ]

        usage = {
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            "total_tokens": response.usage.total_tokens if response.usage else 0
        }

        return LLMResponse(
            content=msg.content or "",
            tool_calls=tool_calls,
            finish_reason=choice.finish_reason or "stop",
            usage=usage
        )


def get_llm_client() -> BaseLLMClient:
    """Factory selecting the appropriate LLM client based on environment."""
    if settings.DEFAULT_LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        try:
            return OpenAILLMClient(api_key=settings.OPENAI_API_KEY)
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI client: {e}. Falling back to simulator.")
            return SimulatorLLMClient()
    return SimulatorLLMClient()
