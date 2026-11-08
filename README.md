# 🤖 BalaGPT (Full-Stack Personal AI)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/layyzee/chatgpt-web)
[![Documentation](https://img.shields.io/badge/Documentation-Complete%20Architecture%20Guide-blue)](PROJECT_DOCUMENTATION.md)

A high-performance personal AI with persistent SQLite memory, real-time word-by-word streaming, live web search, document Q&A, voice chat, session management, and zero API costs. Powered locally by **Ollama (Llama 3.2 & Qwen 2.5 Coder)** and in the cloud by **Groq (GPT-OSS 120B & Qwen 27B)**.

> 📖 **Looking for full system architecture, database ER diagrams, and technical justifications?**  
> Check out the complete [**Project Technical Documentation & Architecture Guide**](PROJECT_DOCUMENTATION.md).

---

## ✨ Features & Superpowers

- **🧠 Multi-Model AI Engine:**
  - **GPT-OSS (120B):** Frontier 120-Billion parameter cloud model running at 800+ tokens/sec via Groq.
  - **Llama 3.2 (3B):** General offline reasoning running locally on your Mac via Ollama.
  - **Qwen 2.5 Coder (1.5B):** High-speed code writing, debugging, and syntax specialist.
  - Zero API fees, zero token rate limits, zero privacy leaks.
- **🌐 Real-Time Live Web Search:**
  - Toggle the **Web Search** button to let BalaGPT query the live internet via DuckDuckGo in real-time.
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
- **📎 Multi-Page PDF & Universal Document Knowledge Base:**
  - Attach `.pdf`, `.csv`, `.tsv`, `.py`, `.js`, `.txt`, `.md`, `.json`, `.sql` files directly to your prompt.
  - Multi-page PDF text extraction with page numbers, analyzing up to 20MB files against the 131k token context window.
- **🎭 AI Personas & System Roles:**
  - Toggle between specialized personas: Senior Software Architect, BGMI & Esports Coach, Executive Resume Pro, First-Principles Thinker, or build your own Custom Persona.
- **🔒 Master Password Protection:**
  - Secure lock screen with scrypt-hashed password encryption and 30-day session tokens.
- **📱 PWA (Installable Native App):**
  - Tap **"Add to Home Screen"** on iOS Safari or Android Chrome for a full-screen native mobile experience.
- **💾 Full SQLite Persistence:**
  - Stores all chat history, conversations, and timestamps in a local SQLite database (`backend/chat.db`).

---

## 🚀 How to Run

### Start BalaGPT:
```bash
./start.sh
```
- **Frontend:** [http://localhost:5174](http://localhost:5174)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

### Stop BalaGPT (Zero Battery Drain):
Whenever you are done testing, run:
```bash
./stop.sh
```
This terminates all backend/frontend processes, kills the Cloudflare tunnel, and unloads AI models from unified RAM—bringing CPU, GPU, and battery drain down to **0%**.

---

## ☁️ Cloud Deployment & Live Operations

| Resource / Target | Identifier / URL | Status |
| :--- | :--- | :--- |
| **Live Web App** | [https://balagpt.onrender.com](https://balagpt.onrender.com) | 🟢 Live (HTTP 200) |
| **Render Dashboard** | [https://dashboard.render.com](https://dashboard.render.com) | Service: **`balagpt`** |
| **Render Blueprint ID** | `exs-dbo1adnf3r2c739tlq0g` | Region: Oregon, US |
| **Groq Cloud Console** | [https://console.groq.com](https://console.groq.com) | Free LPU Engine (800+ t/s) |
| **GitHub Repository** | [https://github.com/layyzee/chatgpt-web](https://github.com/layyzee/chatgpt-web) | CI/CD on `main` |

### Deploy New Instance
Click the **Deploy to Render** button above or use:
👉 **[Deploy BalaGPT to Render](https://render.com/deploy?repo=https://github.com/layyzee/chatgpt-web)**

---

## 📄 License
MIT License. Free to use, modify, and distribute.
