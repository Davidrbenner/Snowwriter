# ❄️ Snowwriter

Snowwriter is a sleek, professional, distraction-free AI-powered grammar checker and text rewriting application. It features a modern, ultra-clean "Icy" design built with **React**, **Vite**, and **Tailwind CSS**. 

Snowwriter is built with an **Offline-First / Zero-Hosting / Local-Inference** model in mind, giving you the choice between using Google Cloud's fast **Gemini 3 Flash** or running models **100% locally** in your browser via WebGPU or connecting to an existing **Ollama** installation.

---

## ✨ Features

- **Triple-Model Engine Choice**:
  - **Google Cloud**: Powered by the Gemini API for fast, high-accuracy editing.
  - **WebGPU Neural Core**: Download model weights (like Gemma 2B, Llama 3.2, or Phi-3.5) directly into your browser's persistent cache. Once downloaded, inference is computed 100% locally on your graphics chip—zero data leaves your device.
  - **Ollama Integration**: Connect seamlessly to your personal pre-installed Ollama daemon runtime (e.g. at `http://localhost:11434`) and point it to any custom downloaded model tag.
- **Workflow Integrations**:
  - **General Text Editor**: Simple, elegant workspace for writing.
  - **Outlook Draft**: Interactively compose, refine, and simulated-send directly to Microsoft Outlook workflows.
  - **Gmail Draft**: Clean, modern suite integration allowing copy-paste-free updates inside simulated Google Gmail composings.
- **Productivity Boosters**:
  - **Drag-to-Bookmark Bar**: A draggable JavaScript Web bookmarklet. Select text on any web page, click your bookmark, and it automatically imports that selection straight into your Snowwriter tab!
  - **Global Script Triggers**: Quick-copy snippets for Windows AutoHotkey and macOS AppleScript to bind global system hotkeys to Snowwriter.

---

## 🚀 Getting Started

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher is recommended) along with `npm`.

### 2. Installation

Clone your repository from GitHub and install the base dependencies:

```bash
git clone https://github.com/your-username/snowwriter.git
cd snowwriter
npm install
```

### 3. Setup Environment Variables

Copy the example climate configuration template into your environment file:

```bash
cp .env.example .env
```

Open `.env` and configure your credentials safely (do NOT commit your real keys to git!):

```env
# Load your Google Gemini API Key
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Set your deployed application URL (used for absolute self-references)
APP_URL="http://localhost:3000"
```

### 4. Running Locally in Development

Launch the Vite build engine with local watcher channels:

```bash
npm run dev
```

Your browser will launch and load the application live at **`http://localhost:3000`**.

---

## 📦 Building and Publishing

### 1. Verification Checking

To check TypeScript type alignments and capture static safety before deploying:

```bash
npm run lint
```

### 2. Build for Production

Compile a optimized, production-ready static site output:

```bash
npm run build
```

The build assets (CSS, highly-compressed Javascript, static file wrappers) will build cleanly inside the `/dist` directory.

---

## 🌐 Deploying to GitHub & the Web

Since Snowwriter compiles into static SPA files, it can be hosted completely **free** on multiple serverless and edge networks!

### Option A: Deploy to GitHub Pages (Easiest for Static Releases)

If you are publishing repository pages directly to GitHub pages, you can easily set up standard GitHub Actions pipelines to deploy automatically:

1. **Configure Repository Base Path**:
   If your repository is hosted at `https://your-username.github.io/snowwriter/`, you'll want to add the `base` property to your `vite.config.ts` so asset routing maps correctly:
   ```typescript
   export default defineConfig(({mode}) => {
     return {
       base: '/snowwriter/', // Make sure this matches your repository name!
       // ... existing plugins and configs
     }
   })
   ```
2. **Setup Environment Variables**:
   Since GitHub Pages is static and variables defined during client-side compilation are bundled directly in the output:
   - Go to your repository **Settings > Secrets and Variables > Actions**.
   - Create a repository secret named `GEMINI_API_KEY` containing your API key.
   - Use a GitHub action script to inject this keyword during compilation step.

### Option B: Deploy to Vercel, Netlify, or Cloudflare Pages (Recommended)

Modern hosting platforms automatically detect Vite configurations and manage pipeline environment variables with pristine ease.

1. Create a new project in your platform configuration panel connected to your GitHub repository.
2. Configure **Build Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Configure **Environment Variables**:
   - Add a key for **`GEMINI_API_KEY`** with your official Gemini Token so clients can resolve backend cloud revisions successfully.
4. Deploy! Your URL endpoint is automatically provisioned with fully secure TLS handshakes.

---

## 🧠 Customizing Offline Models

Snowwriter is built with model flexibility:
- If someone already has standard model targets installed (such as via Ollama running in the background), they can select the **Ollama** engine tab, reference the customizable endpoint, and enter any model tag they want (like `llama3`, `mistral`, or a custom fine-tune).
- If you'd like to adjust default WebGPU targets as newer models are released, you can easily open and modify `src/App.tsx` where models list arrays are stored—adding weight files, size rankings, and custom instructions.

---

## 📜 License

This project is licensed under the Apache-2.0 License. See the LICENSE file for details.
