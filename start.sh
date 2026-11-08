#!/usr/bin/env bash
# Start ChatGPT Web App (Backend + Frontend + Public Cloudflare Tunnel)

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$HOME/.local/node/bin:$PATH"

echo "=================================================="
echo "🚀 Starting Full-Stack ChatGPT Web App"
echo "   Backend:  http://127.0.0.1:3001"
echo "   Frontend: http://127.0.0.1:5174"
echo "   Model:    Local Llama 3.2 3B (Ollama - 100% Offline, \$0)"
echo "   Database: SQLite (backend/chat.db)"
echo "=================================================="

# Ensure ollama is running
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "• Starting local Ollama server..."
  nohup ollama serve >/dev/null 2>&1 &
  sleep 1
fi

# Start backend
cd "$DIR/backend"
node server.js &
BACKEND_PID=$!

# Start frontend
cd "$DIR/frontend"
npx vite --port 5174 --host 0.0.0.0 &
FRONTEND_PID=$!

# Start Cloudflare Tunnel
echo "• Launching secure public tunnel..."
cloudflared tunnel --url http://127.0.0.1:5174 > "$DIR/tunnel.log" 2>&1 &
TUNNEL_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID 2>/dev/null" EXIT

# Wait for tunnel URL
for i in {1..20}; do
  if grep -q "trycloudflare.com" "$DIR/tunnel.log" 2>/dev/null; then
    PUBLIC_URL=$(grep -o 'https://[-a-zA-Z0-9]*\.trycloudflare\.com' "$DIR/tunnel.log" | tail -n 1)
    echo ""
    echo "=================================================="
    echo "🌍 PUBLIC HTTPS LINK (Works on your phone/friends):"
    echo "   👉 $PUBLIC_URL"
    echo "=================================================="
    echo ""
    break
  fi
  sleep 0.5
done

sleep 1
open "http://127.0.0.1:5174"

wait
