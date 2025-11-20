set -e

: "${AGENT_HOST:=0.0.0.0}"
: "${AGENT_PORT:=8000}"


exec uvicorn agent.main:app --host "$AGENT_HOST" --port "$AGENT_PORT" --reload
