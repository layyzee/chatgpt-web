# 🤖 ChatGPT Web Clone (Full-Stack + Local AI)

A full-fledged ChatGPT clone with persistent SQLite memory, real-time word-by-word streaming, code highlighting with 1-click copy, and zero API costs. Powered locally by **Ollama (Llama 3.2 3B)** or switchable to cloud models.

---

## ✨ Features

- **🧠 100% Free & Local AI Engine:**
  - Uses local **Llama 3.2 (3B)** via Ollama.
  - Zero API fees, zero token rate limits, zero privacy leaks. Everything stays on your machine.
- **⚡ Real-Time Streaming:**
  - Token-by-token streaming via Server-Sent Events (SSE).
  - Typewriter rendering with stop-generation support.
- **💾 Full SQLite Persistence:**
  - Stores all chat history, conversations, and timestamps in a local SQLite database (`chat.db`).
  - Native `node:sqlite` implementation with zero external C++ build dependencies.
- **🎨 Modern ChatGPT Dark UI:**
  - Responsive sidebar with conversation list.
  - Rename, delete, and search past chats.
  - Formatted Markdown rendering with syntax highlighting.
  - Code block headers with language badges and instant **"Copy code"** buttons.
  - Auto-growing text input.
- **🌐 Mobile & Remote Access Ready:**
  - Built-in Cloudflare Tunnel integration for instant, secure public HTTPS access on iOS/Android from anywhere without port forwarding.

---

## 🛠️ Architecture

```
chatgpt-web/
├── backend/
│   ├── server.js        # Express API + SSE streaming router
│   ├── db.js            # Native SQLite database schema & queries
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main ChatGPT interface & state
│   │   ├── main.jsx
│   │   └── index.css    # Tailwind styling
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── start.sh             # 1-click launcher (Ollama + Backend + Frontend + Tunnel)
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20+ or v24+ (v26 recommended)
- **Ollama**: [Download Ollama](https://ollama.com/)
  ```bash
  ollama pull llama3.2:3b
  ```

### 2. Installation
Clone this repository and install dependencies:
```bash
git clone https://github.com/layyzee/chatgpt-web.git
cd chatgpt-web

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### 3. Launch
Run the automated start script:
```bash
chmod +x start.sh
./start.sh
```

- **Frontend:** [http://localhost:5174](http://localhost:5174)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## 📱 Mobile Access (Optional Cloudflare Tunnel)

To access your local ChatGPT instance on your phone over 5G/WiFi:
```bash
cloudflared tunnel --url http://127.0.0.1:5174
```
Scan the generated QR code or open the `*.trycloudflare.com` URL on your phone!

---

## 📄 License
MIT License. Free to use, modify, and distribute.
