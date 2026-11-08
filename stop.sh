#!/usr/bin/env bash
# Stop ChatGPT Web App (Backend + Frontend + Cloudflare Tunnel + Ollama models)
# This completely frees up your Mac's RAM, GPU, and CPU for zero battery drain.

echo "=================================================="
echo "🛑 Shutting Down ChatGPT Web & Freeing Up Resources"
echo "=================================================="

# 1. Kill Node backend on port 3001
PID_3001=$(lsof -ti :3001 2>/dev/null || true)
if [ -n "$PID_3001" ]; then
  echo "• Stopping Backend Server (PID $PID_3001)..."
  kill -9 $PID_3001 2>/dev/null || true
fi

# 2. Kill Vite frontend on port 5174
PID_5174=$(lsof -ti :5174 2>/dev/null || true)
if [ -n "$PID_5174" ]; then
  echo "• Stopping Frontend Server (PID $PID_5174)..."
  kill -9 $PID_5174 2>/dev/null || true
fi

# 3. Kill Cloudflare tunnel
pkill -f "cloudflared tunnel" 2>/dev/null || true
echo "• Stopped Cloudflare Tunnel."

# 4. Unload Ollama AI models from unified RAM
if command -v ollama >/dev/null 2>&1; then
  echo "• Unloading Ollama models from unified memory..."
  ollama stop llama3.2:3b 2>/dev/null || true
  ollama stop qwen2.5-coder:1.5b 2>/dev/null || true
fi

echo "=================================================="
echo "✅ Everything stopped! 0% CPU, 0% Battery Drain."
echo "   Run ./start.sh whenever you want to test again."
echo "=================================================="
