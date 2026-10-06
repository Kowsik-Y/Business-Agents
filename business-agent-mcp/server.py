"""
Model Context Protocol (MCP) Server for AI Sales Assistant.
Compliant with MCP specification version 2024-11-05 (JSON-RPC 2.0).
Supports:
1. Stdio transport (for Claude Desktop, Cursor, and IDE extensions)
2. HTTP/SSE transport (for remote web clients and microservices)
"""

import asyncio
import json
import logging
import os
import sys
from typing import Any, Dict, Optional

# Ensure sibling server directory and current directory are on sys.path dynamically
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "business-agent-server"))
for path in (CURRENT_DIR, SERVER_DIR):
    if path not in sys.path:
        sys.path.insert(0, path)

from tools import list_tools, execute_tool
from resources import list_resources, get_resource
from prompts import list_prompts, get_prompt_messages

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("mcp-sales-server")

PROTOCOL_VERSION = "2024-11-05"
SERVER_INFO = {
    "name": "business-agent-sales-mcp",
    "version": "1.0.0"
}


class MCPServer:
    """Core Model Context Protocol JSON-RPC 2.0 dispatcher."""

    async def handle_request(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        req_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        # Handle notifications (no response needed)
        if method == "notifications/initialized":
            logger.info("MCP Client connection initialized.")
            return None

        # Method Dispatcher
        try:
            if method == "initialize":
                result = {
                    "protocolVersion": PROTOCOL_VERSION,
                    "capabilities": {
                        "tools": {"listChanged": False},
                        "resources": {"subscribe": False, "listChanged": False},
                        "prompts": {"listChanged": False}
                    },
                    "serverInfo": SERVER_INFO
                }
            elif method == "ping":
                result = {}
            elif method == "tools/list":
                result = {"tools": list_tools()}
            elif method == "tools/call":
                tool_name = params.get("name")
                arguments = params.get("arguments", {})
                tool_output = await execute_tool(tool_name, arguments)
                result = {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(tool_output, indent=2) if isinstance(tool_output, (dict, list)) else str(tool_output)
                        }
                    ]
                }
            elif method == "resources/list":
                result = {"resources": list_resources()}
            elif method == "resources/read":
                uri = params.get("uri")
                res = get_resource(uri)
                result = {
                    "contents": [
                        {
                            "uri": res["uri"],
                            "mimeType": res["mimeType"],
                            "text": res["text"]
                        }
                    ]
                }
            elif method == "prompts/list":
                result = {"prompts": list_prompts()}
            elif method == "prompts/get":
                name = params.get("name")
                arguments = params.get("arguments", {})
                messages = get_prompt_messages(name, arguments)
                result = {
                    "description": f"Prompt for {name}",
                    "messages": messages
                }
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Method not found: '{method}'"
                    }
                }

            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": result
            }

        except Exception as e:
            logger.exception(f"Error handling MCP method '{method}': {e}")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32603,
                    "message": f"Internal MCP error: {str(e)}"
                }
            }


async def run_stdio():
    """Runs the MCP server over standard input/output (stdio transport)."""
    server = MCPServer()
    logger.info("Starting Business Agent MCP Server on Stdio...")

    loop = asyncio.get_event_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)

    while True:
        line = await reader.readline()
        if not line:
            break
        text = line.decode().strip()
        if not text:
            continue

        try:
            req = json.loads(text)
            resp = await server.handle_request(req)
            if resp is not None:
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()
        except Exception as ex:
            logger.error(f"Error parsing stdio line: {ex}")


def create_http_app():
    """Creates a FastAPI/Starlette app for HTTP and SSE transports."""
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI(title="Business Agent MCP Server", version="1.0.0")
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

    mcp_server = MCPServer()

    @app.post("/mcp/rpc")
    async def rpc_endpoint(request: Request):
        body = await request.json()
        response = await mcp_server.handle_request(body)
        return JSONResponse(content=response or {})

    @app.get("/health")
    async def health():
        return {"status": "healthy", "service": "business-agent-mcp"}

    return app


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--http":
        import uvicorn
        port = int(sys.argv[2]) if len(sys.argv) > 2 else 8001
        print(f"Starting MCP Server on HTTP port {port}...")
        app = create_http_app()
        uvicorn.run(app, host="0.0.0.0", port=port)
    else:
        asyncio.run(run_stdio())
