"""
Test suite for Model Context Protocol (MCP) server implementation.
"""

import asyncio
import pytest
from server import MCPServer


@pytest.mark.asyncio
async def test_mcp_initialize():
    server = MCPServer()
    req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "test-client", "version": "1.0"}
        }
    }
    resp = await server.handle_request(req)
    assert resp["jsonrpc"] == "2.0"
    assert resp["id"] == 1
    assert "capabilities" in resp["result"]
    assert "tools" in resp["result"]["capabilities"]
    assert "resources" in resp["result"]["capabilities"]
    assert resp["result"]["serverInfo"]["name"] == "business-agent-sales-mcp"


@pytest.mark.asyncio
async def test_mcp_tools_list():
    server = MCPServer()
    req = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {}
    }
    resp = await server.handle_request(req)
    tools = resp["result"]["tools"]
    tool_names = [t["name"] for t in tools]
    assert "crm_lookup_lead" in tool_names
    assert "enrich_company_profile" in tool_names
    assert "calculate_lead_score" in tool_names
    assert "run_sales_assistant" in tool_names


@pytest.mark.asyncio
async def test_mcp_tools_call():
    server = MCPServer()
    req = {
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "calculate_lead_score",
            "arguments": {
                "company_size": 150,
                "budget": 50000,
                "timeline_months": 2,
                "has_authority": True
            }
        }
    }
    resp = await server.handle_request(req)
    assert "content" in resp["result"]
    assert len(resp["result"]["content"]) > 0
    text = resp["result"]["content"][0]["text"]
    assert "qualified" in text.lower()


@pytest.mark.asyncio
async def test_mcp_resources_list_and_read():
    server = MCPServer()
    # List resources
    req = {"jsonrpc": "2.0", "id": 4, "method": "resources/list", "params": {}}
    resp = await server.handle_request(req)
    resources = resp["result"]["resources"]
    assert len(resources) >= 3

    # Read playbook resource
    read_req = {
        "jsonrpc": "2.0",
        "id": 5,
        "method": "resources/read",
        "params": {"uri": "business://sales/playbook"}
    }
    read_resp = await server.handle_request(read_req)
    contents = read_resp["result"]["contents"]
    assert len(contents) == 1
    assert "Ideal Customer Profile" in contents[0]["text"]


@pytest.mark.asyncio
async def test_mcp_prompts_list_and_get():
    server = MCPServer()
    req = {"jsonrpc": "2.0", "id": 6, "method": "prompts/list", "params": {}}
    resp = await server.handle_request(req)
    prompts = resp["result"]["prompts"]
    prompt_names = [p["name"] for p in prompts]
    assert "qualify-sales-lead" in prompt_names

    get_req = {
        "jsonrpc": "2.0",
        "id": 7,
        "method": "prompts/get",
        "params": {
            "name": "qualify-sales-lead",
            "arguments": {"company": "Acme Corp", "contact_role": "VP"}
        }
    }
    get_resp = await server.handle_request(get_req)
    messages = get_resp["result"]["messages"]
    assert len(messages) == 1
    assert "Acme Corp" in messages[0]["content"]["text"]
