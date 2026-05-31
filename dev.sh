#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"

backend_pid=""
frontend_pid=""
cleanup_started="false"

cleanup() {
  if [[ "$cleanup_started" == "true" ]]; then
    return
  fi

  cleanup_started="true"
  echo
  echo "Stopping dev servers..."

  if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid" 2>/dev/null || true
  fi

  if [[ -n "$frontend_pid" ]] && kill -0 "$frontend_pid" 2>/dev/null; then
    kill "$frontend_pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT
trap 'cleanup; exit 130' INT
trap 'cleanup; exit 143' TERM

if [[ ! -f "$BACKEND_DIR/manage.py" ]]; then
  echo "backend/manage.py not found."
  exit 1
fi

if [[ ! -f "$FRONTEND_DIR/package.json" ]]; then
  echo "frontend/package.json not found."
  exit 1
fi

if [[ -x "$BACKEND_DIR/venv/bin/python" ]]; then
  BACKEND_PYTHON="$BACKEND_DIR/venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  BACKEND_PYTHON="python3"
else
  echo "Python not found. Create backend/venv or install python3."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js first."
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "frontend/node_modules not found. Run: cd frontend && npm install"
  exit 1
fi

echo "Starting Django API: http://localhost:$BACKEND_PORT"
(
  cd "$BACKEND_DIR"
  "$BACKEND_PYTHON" manage.py runserver "$BACKEND_PORT"
) &
backend_pid=$!

echo "Starting Vite web server: http://localhost:3002"
(
  cd "$FRONTEND_DIR"
  npm run dev -- --host "$FRONTEND_HOST"
) &
frontend_pid=$!

while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null; do
  sleep 1
done

wait "$backend_pid" 2>/dev/null || true
wait "$frontend_pid" 2>/dev/null || true
