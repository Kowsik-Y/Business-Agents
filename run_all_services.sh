#!/usr/bin/env bash
# ==============================================================================
# Intelligent Customer Success & Service Automation — System Orchestration Runner
# Spins up local infrastructure, all Node/TS web frontends and microservices,
# and Python AI Orchestrator + Voice Service engines in a single terminal session.
# ==============================================================================

# Ensure execution inside the repository root workspace directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Cleanup function to gracefully stop all running services upon exit or interruption
cleanup() {
    echo -e "\n\033[1;33m[!] Shutdown signal received. Stopping all running services and background processes...\033[0m"
    # Terminate all child process groups initiated in this subshell
    kill 0 2>/dev/null || true
    echo -e "\033[1;32m[✓] All services have been cleanly closed and terminated. Goodbye!\033[0m"
    exit 0
}

# Trap terminal interruption (Ctrl+C, SIGHUP, SIGTERM, EXIT)
trap cleanup SIGINT SIGTERM EXIT SIGHUP

clear
echo -e "\033[1;36m=================================================================================\033[0m"
echo -e "\033[1;37m🚀 STARTING INTELLIGENT CUSTOMER SUCCESS & SERVICE AUTOMATION PLATFORM 🚀\033[0m"
echo -e "\033[1;36m=================================================================================\033[0m"
echo -e "\033[1;32m[1/3] Checking & releasing any orphaned application ports...\033[0m"
for port in 3000 3001 3002 8000 8001 8002 8003 8004 8005 8006; do
    lsof -ti :$port | xargs kill -9 2>/dev/null || true
done

echo -e "\033[1;32m[2/3] Checking & booting local Docker infrastructure (PostgreSQL, Redis, Temporal)...\033[0m"
docker compose up -d 2>/dev/null || echo -e "\033[1;33m[!] Notice: Docker compose not detected or already managed externally. Continuing...\033[0m"

echo -e "\n\033[1;32m[3/3] Locating Python virtual environments and service binaries...\033[0m"
if [ -f "$DIR/services/voice-service/.venv/bin/uvicorn" ]; then
    UVICORN_BIN="$DIR/services/voice-service/.venv/bin/uvicorn"
else
    UVICORN_BIN="$(command -v uvicorn || echo 'uvicorn')"
fi

echo -e "\n\033[1;32m[3/3] Launching multi-service interactive log streams...\033[0m"
echo -e "\033[1;37m---------------------------------------------------------------------------------\033[0m"
echo -e "  🌐 Customer Portal (Web Chat)  : \033[4;34mhttp://localhost:3000\033[0m"
echo -e "  🎧 Agent Command Center        : \033[4;35mhttp://localhost:3001\033[0m"
echo -e "  🛡️  Admin Management Console    : \033[4;36mhttp://localhost:3002\033[0m"
echo -e "  ⚙️  Core Business API (Swagger) : \033[4;33mhttp://localhost:8000/api-docs\033[0m"
echo -e "  🧠 AI Orchestrator (LangGraph) : \033[4;32mhttp://localhost:8002/docs\033[0m"
echo -e "  🗣️  Voice Service (WebSockets)  : \033[4;31mhttp://localhost:8004/docs\033[0m"
echo -e "  📧 Notification Service        : \033[0mhttp://localhost:8005\033[0m"
echo -e "  ⏱️  Temporal Workflow Worker    : \033[0mhttp://localhost:8006\033[0m"
echo -e "\033[1;37m---------------------------------------------------------------------------------\033[0m"
echo -e "\033[1;33m👉 Press [Ctrl + C] or close window at any time to immediately close all services.\033[0m\n"

# Execute concurrently with colored output and immediate cross-service termination on exit
pnpm exec concurrently \
    --names "NODE-STACK,AI-ORCH,VOICE-ENGINE" \
    --prefix-colors "cyan.bold,green.bold,magenta.bold" \
    --kill-others-on-fail \
    --kill-others \
    "pnpm dev" \
    "cd services/ai-orchestrator && PYTHONPATH=src:../../python-packages/ai-contracts/src \"$UVICORN_BIN\" ai_orchestrator.main:app --port 8002 --reload --host 0.0.0.0" \
    "cd services/voice-service && PYTHONPATH=src:../../python-packages/ai-contracts/src \"$UVICORN_BIN\" voice_service.main:app --port 8004 --reload --host 0.0.0.0"
