# 🤖 ChatGPT Web Clone (Full-Stack + Local AI)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/layyzee/chatgpt-web)

A production-grade ChatGPT clone with persistent SQLite memory, real-time word-by-word streaming, live web search, document Q&A, voice chat, session management, and zero API costs. Powered locally by **Ollama (Llama 3.2 & Qwen 2.5 Coder)**.

---

## ✨ Features & Superpowers

- **🧠 100% Free & Local AI Engines:**
  - **Llama 3.2 (3B):** General reasoning, chat, and explanation.
  - **Qwen 2.5 Coder (1.5B):** High-speed code writing, debugging, and syntax expert.
  - Zero API fees, zero token rate limits, zero privacy leaks. Everything runs on your Mac.
- **🌐 Real-Time Live Web Search:**
  - Toggle the **Web Search** button to let local models query the live internet via DuckDuckGo in real-time.
  - Perfect for current events, latest sports scores, and recent documentation.
- **📥 Export Chats (Markdown & PDF):**
  - Download formatted `.md` files or print directly to clean PDF documents with one click.
- **🛡️ Admin & Device Portal:**
  - See all active connected devices with IP, country, and device type.
  - 1-click kick/disconnect unwanted devices or revoke all sessions remotely.
  - SQLite database size and message stats monitor.
- **🎙️ Voice Chat (Speech-to-Text & Text-to-Speech):**
  - **Dictation:** Tap the microphone icon to speak your prompts.
  - **Read Aloud:** Tap the speaker icon on any assistant message to hear it read out loud.
- **📎 Document & Code Attachment (Document Q&A):**
  - Attach `.py`, `.js`, `.txt`, `.md`, `.json`, `.csv`, `.sql` files directly to your prompt.
- **🔒 Master Password Protection:**
  - Secure lock screen with scrypt-hashed password encryption and 30-day session tokens.
- **📱 PWA (Installable Native App):**
  - Tap **"Add to Home Screen"** on iOS Safari or Android Chrome for a full-screen native mobile experience.
- **💾 Full SQLite Persistence:**
  - Stores all chat history, conversations, and timestamps in a local SQLite database (`backend/chat.db`).

---

## 🚀 How to Run

### Start App:
```bash
./start.sh
```
- **Frontend:** [http://localhost:5174](http://localhost:5174)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

### Stop App (Zero Battery Drain):
Whenever you are done testing, run:
```bash
./stop.sh
```
This terminates all backend/frontend processes, kills the Cloudflare tunnel, and unloads AI models from unified RAM—bringing CPU, GPU, and battery drain down to **0%**.

---

## 📄 License
MIT License. Free to use, modify, and distribute.
