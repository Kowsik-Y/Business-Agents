"""
Tool Calling Engine and Tool Registry.
Taught in Module 3 (1:00-2:00): LLM -> tool selection -> execution -> result -> final response.
"""

import inspect
import json
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, create_model


class Tool:
    """Represents an executable tool exposed to agents and MCP."""
    def __init__(
        self,
        name: str,
        description: str,
        fn: Callable,
        parameters_schema: Optional[Dict[str, Any]] = None,
        agent_domain: str = "general"
    ):
        self.name = name
        self.description = description
        self.fn = fn
        self.agent_domain = agent_domain
        self.parameters_schema = parameters_schema or self._generate_schema_from_fn(fn)

    def _generate_schema_from_fn(self, fn: Callable) -> Dict[str, Any]:
        """Auto-generates OpenAI/MCP compatible JSON Schema from Python function signatures."""
        sig = inspect.signature(fn)
        properties = {}
        required = []

        type_map = {
            str: "string",
            int: "integer",
            float: "number",
            bool: "boolean",
            list: "array",
            dict: "object",
        }

        for param_name, param in sig.parameters.items():
            if param_name in ("self", "ctx"):
                continue
            
            p_type = param.annotation
            json_type = type_map.get(p_type, "string")
            properties[param_name] = {
                "type": json_type,
                "description": f"Parameter: {param_name}"
            }
            if param.default is inspect.Parameter.empty:
                required.append(param_name)

        return {
            "type": "object",
            "properties": properties,
            "required": required
        }

    def to_openai_schema(self) -> Dict[str, Any]:
        """Formats the tool for OpenAI function calling."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters_schema
            }
        }

    def to_mcp_schema(self) -> Dict[str, Any]:
        """Formats the tool for Model Context Protocol (MCP) tools/list."""
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": self.parameters_schema
        }

    async def execute(self, **kwargs) -> Any:
        """Executes the tool asynchronously or synchronously."""
        if inspect.iscoroutinefunction(self.fn):
            return await self.fn(**kwargs)
        else:
            return self.fn(**kwargs)


class ToolRegistry:
    """Central catalog of tools across all business domains."""
    def __init__(self):
        self._tools: Dict[str, Tool] = {}

    def register(self, tool: Tool):
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)

    def list_tools(self, domain: Optional[str] = None) -> List[Tool]:
        if domain:
            return [t for t in self._tools.values() if t.agent_domain == domain]
        return list(self._tools.values())

    def get_openai_tools(self, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        return [t.to_openai_schema() for t in self.list_tools(domain)]

    def get_mcp_tools(self, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        return [t.to_mcp_schema() for t in self.list_tools(domain)]


registry = ToolRegistry()


def tool(name: Optional[str] = None, description: Optional[str] = None, domain: str = "general"):
    """Decorator to register functions as tools."""
    def decorator(fn: Callable):
        tool_name = name or fn.__name__
        tool_desc = description or (fn.__doc__ or "").strip() or f"Execute {tool_name}"
        t = Tool(
            name=tool_name,
            description=tool_desc,
            fn=fn,
            agent_domain=domain
        )
        registry.register(t)
        return fn
    return decorator
