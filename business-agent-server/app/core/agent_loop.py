"""
Reusable Agent Execution Loop Engine.
Taught in Module 3 (1:00-2:00) & Module 4 (2:50-3:30).

The Canonical Loop:
User Prompt -> System + Context Assembly -> LLM Call -> Tool Selection?
   ├── Yes -> Execute Tool -> Update State/Blackboard -> Emit Event -> Re-prompt LLM (Iterate)
   └── No  -> Validate Structured Output -> Emit Response -> Conclude Turn
"""

import json
import logging
import time
from typing import Any, Callable, Dict, List, Optional, Type
from pydantic import BaseModel, ValidationError

from app.config import settings
from app.core.llm import BaseLLMClient, get_llm_client
from app.core.state import SessionState, ChatMessage
from app.schemas.agent_events import AgentEvent, AgentEventType
from app.tools.base import registry, Tool

logger = logging.getLogger(__name__)

EventCallback = Callable[[AgentEvent], Any]


class AgentLoopRunner:
    """Executes the standard agent loop with tool binding, state updates, and streaming events."""

    def __init__(
        self,
        agent_id: str,
        system_prompt: str,
        tools: Optional[List[Tool]] = None,
        structured_output_model: Optional[Type[BaseModel]] = None,
        llm_client: Optional[BaseLLMClient] = None,
        max_iterations: Optional[int] = None
    ):
        self.agent_id = agent_id
        self.system_prompt = system_prompt
        self.tools = tools or []
        self.structured_output_model = structured_output_model
        self.llm = llm_client or get_llm_client()
        self.max_iterations = max_iterations or settings.MAX_LOOP_ITERATIONS

    async def run(
        self,
        user_prompt: str,
        session: SessionState,
        event_callback: Optional[EventCallback] = None
    ) -> Dict[str, Any]:
        """Runs the complete reasoning and tool execution loop."""

        # Helper to emit events to WebSocket or callback
        async def emit(event_type: AgentEventType, payload: Dict[str, Any]):
            evt = AgentEvent(
                event_type=event_type,
                session_id=session.session_id,
                agent_id=self.agent_id,
                payload=payload
            )
            if event_callback:
                try:
                    res = event_callback(evt)
                    if hasattr(res, "__await__"):
                        await res
                except Exception as ex:
                    logger.warning(f"Error in event callback: {ex}")

        await emit(AgentEventType.AGENT_START, {
            "prompt": user_prompt,
            "system_prompt": self.system_prompt,
            "tools_available": [t.name for t in self.tools]
        })

        # Ensure system prompt is in history if not already present
        if not any(m.role == "system" for m in session.messages):
            session.add_message(role="system", content=self.system_prompt)

        # Append incoming user prompt
        session.add_message(role="user", content=user_prompt)

        iteration = 0
        final_response_text = ""
        structured_data: Optional[Dict[str, Any]] = None

        openai_tools = [t.to_openai_schema() for t in self.tools] if self.tools else None

        while iteration < self.max_iterations:
            iteration += 1
            session.execution_step_count += 1

            await emit(AgentEventType.THOUGHT, {
                "iteration": iteration,
                "message": f"Step {iteration}: Reasoning over session state and determining next action."
            })

            # Call LLM
            llm_response = await self.llm.chat(
                messages=session.messages,
                tools=openai_tools,
                temperature=settings.TEMPERATURE,
                agent_id=self.agent_id
            )

            session.total_tokens_used += llm_response.usage.get("total_tokens", 0)

            # If LLM triggered tool calls
            if llm_response.tool_calls:
                # Add assistant message with tool calls to history
                session.add_message(
                    role="assistant",
                    content=llm_response.content or "",
                    tool_calls=llm_response.tool_calls
                )

                for tc in llm_response.tool_calls:
                    fn_name = tc.get("function", {}).get("name")
                    raw_args = tc.get("function", {}).get("arguments", "{}")
                    call_id = tc.get("id", f"call_{int(time.time()*1000)}")

                    # Parse arguments
                    try:
                        args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                    except Exception:
                        args = {}

                    await emit(AgentEventType.TOOL_CALL_START, {
                        "call_id": call_id,
                        "tool_name": fn_name,
                        "arguments": args
                    })

                    # Execute tool
                    tool_obj = registry.get(fn_name)
                    tool_result: Any = None
                    start_time = time.time()

                    if tool_obj:
                        try:
                            tool_result = await tool_obj.execute(**args)
                        except Exception as e:
                            tool_result = {"error": f"Tool execution failed: {str(e)}"}
                    else:
                        tool_result = {"error": f"Tool '{fn_name}' not found in registry"}

                    exec_time_ms = round((time.time() - start_time) * 1000, 2)

                    await emit(AgentEventType.TOOL_CALL_RESULT, {
                        "call_id": call_id,
                        "tool_name": fn_name,
                        "result": tool_result,
                        "duration_ms": exec_time_ms
                    })

                    # Add tool result to message history
                    result_str = json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result
                    session.add_message(
                        role="tool",
                        content=result_str,
                        name=fn_name,
                        tool_call_id=call_id
                    )

                    # Update session blackboard for business persistence
                    self._update_blackboard_with_tool_result(session, fn_name, tool_result)

                # Loop continues to feed tool results back to LLM
                continue

            # LLM completed response without tool calls
            final_response_text = llm_response.content
            session.add_message(role="assistant", content=final_response_text)

            # Validate Structured Outputs if defined
            if self.structured_output_model:
                structured_data = self._attempt_structured_output_parse(final_response_text)
                if structured_data:
                    await emit(AgentEventType.STRUCTURED_OUTPUT, {
                        "model": self.structured_output_model.__name__,
                        "data": structured_data
                    })

            await emit(AgentEventType.AGENT_RESPONSE, {
                "response": final_response_text,
                "structured_output": structured_data
            })
            break

        await emit(AgentEventType.SESSION_COMPLETE, {
            "iterations": iteration,
            "tokens_used": session.total_tokens_used,
            "messages_count": len(session.messages)
        })

        return {
            "session_id": session.session_id,
            "agent_id": self.agent_id,
            "iterations": iteration,
            "response": final_response_text,
            "structured_output": structured_data,
            "blackboard": session.blackboard.model_dump(),
            "messages_count": len(session.messages)
        }

    def _attempt_structured_output_parse(self, text: str) -> Optional[Dict[str, Any]]:
        """Parses structured JSON from response or creates a synthetic validated instance."""
        if not self.structured_output_model:
            return None

        # 1. Attempt extracting fenced json
        try:
            if "```json" in text:
                json_part = text.split("```json")[1].split("```")[0].strip()
                parsed = json.loads(json_part)
                validated = self.structured_output_model.model_validate(parsed)
                return validated.model_dump()
            elif "{" in text and "}" in text:
                start = text.find("{")
                end = text.rfind("}") + 1
                parsed = json.loads(text[start:end])
                validated = self.structured_output_model.model_validate(parsed)
                return validated.model_dump()
        except Exception:
            pass

        return None

    def _update_blackboard_with_tool_result(self, session: SessionState, tool_name: str, result: Any):
        """Maps tool execution outputs directly into the shared multi-agent blackboard."""
        if tool_name in ("crm_lookup_lead", "calculate_lead_score"):
            session.update_blackboard("active_lead", result)
        elif tool_name in ("analyze_target_channels", "generate_ad_copy_variants"):
            session.update_blackboard("active_campaign", result)
        elif tool_name in ("execute_analytics_sql", "detect_metric_anomalies"):
            session.update_blackboard("analytics_context", result)
        elif tool_name in ("search_support_knowledge_base", "create_support_ticket"):
            session.update_blackboard("support_ticket", result)
        elif tool_name in ("check_service_health", "create_jira_issue", "trigger_workflow_action"):
            session.update_blackboard("operations_incident", result)
