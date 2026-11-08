# 🤖 ChatGPT Web Clone (Full-Stack + Local AI)

A production-grade ChatGPT clone with persistent SQLite memory, real-time word-by-word streaming, voice dictation, speech synthesis, document Q&A, and zero API costs. Powered locally by **Ollama (Llama 3.2 & Qwen 2.5 Coder)**.

---

## ✨ Features & Superpowers

- **🧠 100% Free & Local AI Engines:**
  - **Llama 3.2 (3B):** General reasoning, chat, and explanation.
  - **Qwen 2.5 Coder (1.5B):** High-speed code writing, debugging, and syntax expert.
  - Zero API fees, zero token rate limits, zero privacy leaks. Everything runs on your Mac.
- **🎙️ Voice Chat (Speech-to-Text & Text-to-Speech):**
  - **Dictation:** Tap the microphone icon to speak your prompts.
  - **Read Aloud:** Tap the speaker icon on any assistant message to hear it read out loud naturally.
- **📎 Document & Code Attachment (Document Q&A):**
  - Attach `.py`, `.js`, `.txt`, `.md`, `.json`, `.csv`, `.sql` files directly to your prompt.
  - Ask the local model to analyze, refactor, debug, or summarize your documents.
- **🔒 Master Password Protection:**
  - Secure lock screen with scrypt-hashed password encryption and 30-day session tokens.
  - Prevents unauthorized access over the public tunnel.
- **📱 PWA (Installable Native App):**
  - Includes Web App Manifest and Service Worker.
  - Tap **"Add to Home Screen"** on iOS Safari or Android Chrome to use it like a full-screen native mobile app.
- **💾 Full SQLite Persistence:**
  - Stores all chat history, conversations, and timestamps in a local SQLite database (`backend/chat.db`).
  - Native `node:sqlite` implementation with zero external C++ build dependencies.
- **🌐 Mobile & Remote Access Ready:**
  - Integrated Cloudflare Tunnel for instant, secure public HTTPS access from anywhere.

---

## 🛠️ Architecture

```
chatgpt-web/
├── backend/
│   ├── server.js        # Express API, auth middleware & SSE streaming router
│   ├── db.js            # Native SQLite database schema, sessions & queries
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── manifest.json # PWA manifest
│   │   ├── sw.js         # Service Worker
│   │   └── icon-*.png    # High-res app icons
│   ├── src/
│   │   ├── App.jsx       # State management, responsive drawer & auth check
│   │   ├── components/
│   │   │   ├── AuthScreen.jsx   # Master password lock screen
│   │   │   ├── Sidebar.jsx      # Mobile drawer + Model selector + Sign Out
│   │   │   ├── ChatView.jsx     # Voice mic, file attachment & prompt input
│   │   │   └── MessageItem.jsx  # Markdown, syntax highlight & speech readout
│   │   └── main.jsx
│   └── package.json
├── start.sh              # 1-click launcher (Ollama + Backend + Frontend + Tunnel)
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20+ or v24+ (v26 recommended)
- **Ollama**: [Download Ollama](https://ollama.com/)
  ```bash
  ollama pull llama3.2:3b
  ollama pull qwen2.5-coder:1.5b
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

## 📱 How to Install on Your Phone (PWA)

1. Open your Cloudflare Tunnel URL in **Safari (iOS)** or **Chrome (Android)**.
2. **On iPhone/iPad (Safari):**
   - Tap the **Share** button (box with an arrow pointing up).
   - Scroll down and tap **"Add to Home Screen"**.
3. **On Android (Chrome):**
   - Tap the three dots (⋮) menu or tap the **"Install App"** prompt.
   - Tap **"Add to Home Screen"**.
4. The ChatGPT app icon will appear directly on your home screen and open in full-screen mode without browser URL bars!

---

## 📄 License
MIT License. Free to use, modify, and distribute.
