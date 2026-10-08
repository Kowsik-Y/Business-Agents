"""LangGraph Conversation Graph definition with multi-topic RAG retrieval and sensitive governance handoff.
@see docs/07-ai-orchestrator.md
"""

import json
from typing import Any, Literal
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.graph import END, StateGraph
from langgraph.checkpoint.memory import MemorySaver

from ai_orchestrator.intents import classify_text_intent
from ai_orchestrator.integration_client import IntegrationServiceClient
from ai_orchestrator.llm import generate_chat_response
from ai_orchestrator.prompt_loader import load_prompt
from ai_orchestrator.state import SupportState
from ai_orchestrator.tools import get_tool_definition

integration_client = IntegrationServiceClient()


# --- Institutional RAG Knowledge Base ---
KNOWLEDGE_BASE: dict[str, str] = {
    "pricing_subscriptions": (
        "Our unified Enterprise Technology Platform offers three transparent subscription tiers: "
        "1) VIP Platinum ($99/month) featuring dedicated support supervisors, zero-latency SLA, and hardware priority. "
        "2) Gold Member ($49/month) featuring 24/7 AI conversational voice and text support with advanced diagnostics. "
        "3) Standard (Included) featuring foundational self-service knowledge access and web order tracking."
    ),
    "troubleshooting": (
        "To troubleshoot technical glitches or network connectivity errors on your device: "
        "First, verify your active authentication session token in the security dashboard. "
        "Second, initiate a soft reboot of your network gateway and allow 30 seconds for automated IP calibration. "
        "If the error persists, check our Real-Time Platform Telemetry & Health matrix in the Admin console for cluster anomalies."
    ),
    "warranty_returns": (
        "All corporate hardware and enterprise gateways come standard with a full 2-Year Advanced Replacement Warranty. "
        "If you encounter material hardware defects or component failures within 24 months, our automated return policy guarantees "
        "an instant RMA replacement dispatched via overnight express freight upon diagnostic verification."
    ),
    "account_issues": (
        "For secure account management and identity assurance: You can dynamically update your email, password, and security clearance "
        "directly in your profile badge settings. Multi-Factor Authentication (MFA Level-2 or Level-3) is required before accessing internal audit ledgers or modifying payment credentials."
    ),
    "account_orders": (
        "You can view all orders associated with your account at any time. Our system maintains a complete history of your orders "
        "including current shipping status, carrier details, tracking numbers, and estimated delivery dates. Simply ask to see your orders."
    ),
    "general_faq": (
        "Our Business Agent platform operates 24/7 across voice calls, web chat, emails, and portals. "
        "We can check real-time order tracking, list all your account orders, discuss product pricing and warranty policies, resolve technical issues, or escalate sensitive operations directly to our human support representatives."
    ),
}


# --- Node Functions ---


async def classify_node(state: SupportState) -> dict[str, Any]:
    """Classify user intent, extract entities, evaluate sentiment and risk level using LLM classifier."""
    messages = state.get("messages", [])
    last_user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or getattr(msg, "type", "") == "human":
            last_user_message = str(msg.content)
            break

    existing_entities = state.get("entities", {})
    result = await classify_text_intent(last_user_message, existing_entities)

    return {
        "active_intent": result.active_intent,
        "secondary_intents": result.secondary_intents,
        "entities": result.entities,
        "missing_fields": result.missing_fields,
        "sentiment": result.sentiment,
        "risk_level": result.risk_level,
        "requires_human": result.requires_human,
        "escalation_reason": result.escalation_reason,
    }


async def missing_info_node(state: SupportState) -> dict[str, Any]:
    """Generate clarifying conversational questions dynamically using LLM with deterministic fallback."""
    missing_fields = state.get("missing_fields", [])
    active_intent = state.get("active_intent")
    messages = state.get("messages", [])
    last_user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or getattr(msg, "type", "") == "human":
            last_user_message = str(msg.content)
            break

    system_prompt = load_prompt("clarifying_questions")
    prompt_context = f"User Request: {last_user_message}\nIntent: {active_intent}\nMissing Fields: {missing_fields}"

    question = await generate_chat_response(
        messages=[{"role": "user", "content": prompt_context}],
        system_prompt=system_prompt,
        temperature=0.2,
    )

    if not question:
        if "order_id" in missing_fields:
            if active_intent == "order_cancellation":
                question = "To assist with modifying or cancelling your order, could you please provide your specific order ID (for example, ORD-1001)?"
            else:
                question = "Could you please provide your order ID (for example, ORD-1001) so I can retrieve its real-time shipping status for you?"
        else:
            question = "Could you please provide more details so I can assist you accurately?"

    return {
        "clarifying_question": question,
        "final_response": question,
        "messages": [AIMessage(content=question)],
    }


async def retrieve_node(state: SupportState) -> dict[str, Any]:
    """Retrieve relevant organizational knowledge based on active topic intent."""
    active_intent = state.get("active_intent")
    if active_intent in KNOWLEDGE_BASE:
        return {"retrieved_documents": [KNOWLEDGE_BASE[active_intent]]}
    return {"retrieved_documents": [KNOWLEDGE_BASE["general_faq"]]}


async def plan_node(state: SupportState) -> dict[str, Any]:
    """Plan next action based on classified intent and retrieved organizational knowledge."""
    return {}


async def tool_proposal_node(state: SupportState) -> dict[str, Any]:
    """Propose policy-aware tools dynamically using LLM tool planner with deterministic fallback."""
    active_intent = state.get("active_intent")
    entities = state.get("entities", {})
    customer_id = state.get("customer_id", "")
    messages = state.get("messages", [])
    last_user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or getattr(msg, "type", "") == "human":
            last_user_message = str(msg.content)
            break

    system_prompt = load_prompt("tool_planner")
    prompt_context = (
        f"User Utterance: {last_user_message}\n"
        f"Active Intent: {active_intent}\n"
        f"Extracted Entities: {json.dumps(entities)}\n"
        f"Session Customer ID: {customer_id}"
    )

    try:
        raw_res = await generate_chat_response(
            messages=[{"role": "user", "content": prompt_context}],
            system_prompt=system_prompt,
            temperature=0.0,
        )
        if raw_res:
            clean_json = raw_res.strip()
            if clean_json.startswith("```"):
                clean_json = clean_json.strip("`").removeprefix("json").strip()
            parsed = json.loads(clean_json)
            proposed_tool = parsed.get("proposed_tool")
            proposed_input = parsed.get("proposed_tool_input")
            if proposed_tool:
                return {
                    "proposed_tool": proposed_tool,
                    "proposed_tool_input": proposed_input or {},
                }
    except Exception:
        pass

    # Deterministic Fallback Tool Proposal
    if active_intent == "order_status" and "order_id" in entities:
        order_id = entities["order_id"]
        return {
            "proposed_tool": "get_order_status",
            "proposed_tool_input": {"order_id": order_id},
        }

    if active_intent == "account_orders":
        return {
            "proposed_tool": "list_customer_orders",
            "proposed_tool_input": {"customer_id": customer_id},
        }

    return {"proposed_tool": None, "proposed_tool_input": None}


async def tool_execution_node(state: SupportState) -> dict[str, Any]:
    """Execute proposed tool and attach tool_result."""
    proposed_tool = state.get("proposed_tool")
    tool_input = state.get("proposed_tool_input", {})

    if proposed_tool == "get_order_status":
        order_id = tool_input.get("order_id")
        if order_id:
            order_data = await integration_client.get_order_status(order_id)
            if order_data:
                return {
                    "tool_result": {
                        "success": True,
                        "data": order_data.model_dump(),
                    }
                }
            return {
                "tool_result": {
                    "success": False,
                    "error_code": "NOT_FOUND",
                    "error_message": f"Order {order_id} not found in shipping repository.",
                }
            }

    if proposed_tool == "list_customer_orders":
        customer_id = tool_input.get("customer_id", "")
        if customer_id:
            orders = await integration_client.list_customer_orders(customer_id)
            return {
                "tool_result": {
                    "success": True,
                    "tool_name": "list_customer_orders",
                    "data": [o.model_dump() for o in orders],
                    "count": len(orders),
                }
            }
        return {
            "tool_result": {
                "success": False,
                "tool_name": "list_customer_orders",
                "error_code": "MISSING_CUSTOMER",
                "error_message": "Customer ID not available in session.",
            }
        }

    if proposed_tool == "get_customer_subscription":
        customer_id = tool_input.get("customer_id", "") or state.get("customer_id", "")
        sub_data = await integration_client.get_customer_subscription(customer_id)
        if sub_data:
            return {
                "tool_result": {
                    "success": True,
                    "tool_name": "get_customer_subscription",
                    "data": sub_data,
                }
            }
        return {
            "tool_result": {
                "success": False,
                "tool_name": "get_customer_subscription",
                "error_code": "NOT_FOUND",
                "error_message": "Subscription profile not found.",
            }
        }

    if proposed_tool == "check_warranty_eligibility":
        customer_id = tool_input.get("customer_id", "") or state.get("customer_id", "")
        war_data = await integration_client.check_warranty_eligibility(customer_id)
        if war_data:
            return {
                "tool_result": {
                    "success": True,
                    "tool_name": "check_warranty_eligibility",
                    "data": war_data,
                }
            }
        return {
            "tool_result": {
                "success": False,
                "tool_name": "check_warranty_eligibility",
                "error_code": "NOT_FOUND",
                "error_message": "Warranty records not found.",
            }
        }

    if proposed_tool == "check_device_telemetry":
        customer_id = tool_input.get("customer_id", "") or state.get("customer_id", "")
        dev_data = await integration_client.check_device_telemetry(customer_id)
        if dev_data:
            return {
                "tool_result": {
                    "success": True,
                    "tool_name": "check_device_telemetry",
                    "data": dev_data,
                }
            }
        return {
            "tool_result": {
                "success": False,
                "tool_name": "check_device_telemetry",
                "error_code": "NOT_FOUND",
                "error_message": "Device telemetry offline.",
            }
        }

    return {"tool_result": None}


async def response_generation_node(state: SupportState) -> dict[str, Any]:
    """Generate final grounded assistant response using live LLM with deterministic grounded knowledge fallback."""
    active_intent = state.get("active_intent")
    tool_result = state.get("tool_result")
    retrieved = state.get("retrieved_documents", [])
    messages = state.get("messages", [])
    last_user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or getattr(msg, "type", "") == "human":
            last_user_message = str(msg.content)
            break

    # 1. Attempt live LLM response with grounded context
    system_prompt = load_prompt("response_generator")
    prompt_context = f"Customer Query: {last_user_message}\nIntent: {active_intent}\n"
    if retrieved:
        prompt_context += f"Organizational Knowledge: {retrieved[0]}\n"
    if tool_result:
        prompt_context += f"Verified Tool Result: {tool_result}\n"

    llm_response = await generate_chat_response(
        messages=[{"role": "user", "content": prompt_context}],
        system_prompt=system_prompt,
        temperature=0.3,
    )

    if llm_response:
        return {
            "final_response": llm_response,
            "messages": [AIMessage(content=llm_response)],
        }

    # 2. Deterministic Grounded Fallbacks by Topic
    if active_intent == "order_status" and tool_result:
        if tool_result.get("success"):
            data = tool_result.get("data", {})
            order_id = data.get("order_id")
            status = data.get("status")
            carrier = data.get("carrier")
            tracking = data.get("tracking_number")
            est = data.get("estimated_delivery")

            if status == "shipped":
                carrier_info = f" via {carrier}" if carrier else ""
                tracking_info = f" (Tracking #{tracking})" if tracking else ""
                est_info = f" and is estimated to arrive on {est}" if est else ""
                response = f"Your order {order_id} has shipped{carrier_info}{tracking_info}{est_info}."
            elif status == "delivered":
                carrier_info = f" via {carrier}" if carrier else ""
                response = f"Your order {order_id} has been successfully delivered{carrier_info}."
            elif status == "processing":
                est_info = f" with estimated dispatch on {est}" if est else ""
                response = f"Your order {order_id} is currently processing in our warehouse{est_info}."
            else:
                response = f"Your order {order_id} is currently marked as {status} in our shipping system."
        else:
            entities = state.get("entities", {})
            order_id = entities.get("order_id", "provided")
            response = f"I could not find an active order with ID {order_id}. Please verify the exact order number and let me know."

        return {
            "final_response": response,
            "messages": [AIMessage(content=response)],
        }

    # Account orders multi-order response (deterministic fallback)
    if active_intent == "account_orders" and tool_result:
        if tool_result.get("success"):
            orders_data = tool_result.get("data", [])
            count = tool_result.get("count", 0)
            if count == 0:
                response = "I checked your account and it looks like you don't have any orders on file at the moment. Would you like help with anything else?"
            else:
                lines = [f"I found {count} order{'s' if count != 1 else ''} on your account:\n"]
                for o in orders_data:
                    oid = o.get("order_id", "Unknown")
                    status = o.get("status", "unknown")
                    carrier = o.get("carrier", "")
                    est = o.get("estimated_delivery", "")
                    carrier_info = f" via {carrier}" if carrier else ""
                    est_info = f", estimated delivery {est}" if est else ""
                    lines.append(f"• {oid}: {status.capitalize()}{carrier_info}{est_info}")
                lines.append("\nWould you like more details on any specific order?")
                response = "\n".join(lines)
        else:
            response = "I wasn't able to retrieve your orders at the moment. Please try again or let me know your customer ID."
        return {
            "final_response": response,
            "messages": [AIMessage(content=response)],
        }

    # Subscription details response (deterministic fallback)
    if active_intent == "pricing_subscriptions" and tool_result and tool_result.get("success"):
        data = tool_result.get("data", {})
        tier = data.get("tier", "Standard")
        status = data.get("status", "active")
        price = data.get("monthlyPrice", 0)
        sla = data.get("slaLevel", "Standard SLA")
        renews = data.get("renewsAt", "")
        features = ", ".join(data.get("features", []))
        response = (
            f"Your account is currently on the **{tier}** subscription plan (${price}/month, {status}).\n"
            f"• SLA Level: {sla}\n"
            f"• Features Included: {features}\n"
            f"• Next Renewal Date: {renews}\n\n"
            f"Would you like assistance upgrading or modifying your plan?"
        )
        return {
            "final_response": response,
            "messages": [AIMessage(content=response)],
        }

    # Warranty eligibility response (deterministic fallback)
    if active_intent == "warranty_returns" and tool_result and tool_result.get("success"):
        data = tool_result.get("data", {})
        model = data.get("hardwareModel", "Hardware Device")
        serial = data.get("serialNumber", "")
        covered = "Active Coverage" if data.get("isCovered") else "Expired"
        rma = "Eligible for Instant RMA Replacement" if data.get("rmaEligible") else "Manual Review Required"
        exp = data.get("expirationDate", "")
        option = data.get("replacementOption", "")
        response = (
            f"I checked your warranty records for **{model}** (S/N: {serial}):\n"
            f"• Status: {covered} (Expires {exp})\n"
            f"• RMA Eligibility: {rma}\n"
            f"• Fulfillment: {option}\n\n"
            f"Would you like me to initiate an RMA replacement dispatch for you?"
        )
        return {
            "final_response": response,
            "messages": [AIMessage(content=response)],
        }

    # Device telemetry response (deterministic fallback)
    if active_intent == "troubleshooting" and tool_result and tool_result.get("success"):
        data = tool_result.get("data", {})
        device_id = data.get("deviceId", "")
        gw_status = data.get("gatewayStatus", "online")
        latency = data.get("latencyMs", 0)
        action = data.get("recommendedAction", "")
        response = (
            f"I ran a telemetry check on your device **{device_id}**:\n"
            f"• Gateway Status: {gw_status.upper()} (Latency: {latency}ms)\n"
            f"• Recommended Action: {action}\n\n"
            f"Please verify if following the recommended soft reboot resolves your connection issue."
        )
        return {
            "final_response": response,
            "messages": [AIMessage(content=response)],
        }

    if active_intent in KNOWLEDGE_BASE:
        response = KNOWLEDGE_BASE[active_intent]
        return {
            "final_response": response,
            "messages": [AIMessage(content=response)],
        }

    if active_intent == "greeting":
        greeting = "Hello! I am your AI Customer Success Assistant. How can I assist you today? I can help with product features, pricing, subscription plans, troubleshooting, warranty inquiries, order tracking, or service requests."
        return {
            "final_response": greeting,
            "messages": [AIMessage(content=greeting)],
        }

    fallback = "I want to ensure we resolve your request accurately. Could you tell me if your inquiry relates to order status, subscriptions, technical troubleshooting, warranty policies, or account credentials?"
    return {
        "final_response": fallback,
        "messages": [AIMessage(content=fallback)],
    }


async def handoff_node(state: SupportState) -> dict[str, Any]:
    """Prepare human escalation handoff dynamically using LLM with deterministic fallback."""
    reason = state.get("escalation_reason", "customer_requested")
    entities = state.get("entities", {})
    order_id = entities.get("order_id", "specified")
    messages = state.get("messages", [])
    last_user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or getattr(msg, "type", "") == "human":
            last_user_message = str(msg.content)
            break

    system_prompt = load_prompt("human_handoff")
    prompt_context = (
        f"Customer Message: {last_user_message}\n"
        f"Escalation Reason: {reason}\n"
        f"Order ID: {order_id}\n"
        f"Active Intent: {state.get('active_intent')}"
    )

    response = await generate_chat_response(
        messages=[{"role": "user", "content": prompt_context}],
        system_prompt=system_prompt,
        temperature=0.3,
    )

    if not response:
        if reason == "sensitive_business_operation" or state.get("active_intent") == "order_cancellation":
            response = f"I understand your request involving order {order_id}. Because cancelling or altering active enterprise orders is a sensitive business operation requiring Level-2 verification under our Four-Eyes policy, I am preserving your conversational context and seamlessly transferring you to a senior human support representative in the Agent Command Center now."
        elif reason == "customer_requested":
            response = "I certainly understand. I am retaining your entire conversation history and transferring you directly to an available human support specialist for personalized assistance right now."
        else:
            response = "To provide you with the highest accuracy and security, I am transferring this conversation and your historical context directly to a specialized human representative."

    return {
        "final_response": response,
        "messages": [AIMessage(content=response)],
        "requires_human": True,
    }


# --- Conditional Routing Edges ---


def check_missing_info(state: SupportState) -> Literal["missing_info", "handoff", "continue"]:
    """Determine if clarification, handoff, or standard flow is needed."""
    if state.get("requires_human"):
        return "handoff"
    if state.get("missing_fields"):
        return "missing_info"
    return "continue"


def check_tool_proposed(state: SupportState) -> Literal["execute_tool", "generate_response"]:
    """Determine if tool execution is required."""
    if state.get("proposed_tool"):
        return "execute_tool"
    return "generate_response"


# --- Graph Construction ---


def build_support_graph(checkpointer: Any | None = None) -> Any:
    """Build and compile the LangGraph conversation graph."""
    workflow = StateGraph(SupportState)

    # Add Nodes
    workflow.add_node("classify", classify_node)
    workflow.add_node("missing_info", missing_info_node)
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("plan", plan_node)
    workflow.add_node("tool_proposal", tool_proposal_node)
    workflow.add_node("tool_execution", tool_execution_node)
    workflow.add_node("response_generation", response_generation_node)
    workflow.add_node("handoff", handoff_node)

    # Set Entry Point
    workflow.set_entry_point("classify")

    # Add Edges
    workflow.add_conditional_edges(
        "classify",
        check_missing_info,
        {
            "missing_info": "missing_info",
            "handoff": "handoff",
            "continue": "retrieve",
        },
    )

    workflow.add_edge("missing_info", END)
    workflow.add_edge("handoff", END)

    workflow.add_edge("retrieve", "plan")
    workflow.add_edge("plan", "tool_proposal")

    workflow.add_conditional_edges(
        "tool_proposal",
        check_tool_proposed,
        {
            "execute_tool": "tool_execution",
            "generate_response": "response_generation",
        },
    )

    workflow.add_edge("tool_execution", "response_generation")
    workflow.add_edge("response_generation", END)

    memory = checkpointer if checkpointer is not None else MemorySaver()
    return workflow.compile(checkpointer=memory)
