/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Snowflake, 
  PenLine, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  RotateCcw, 
  ExternalLink,
  Monitor,
  Command,
  Info,
  Coffee,
  Globe,
  LayoutDashboard,
  Zap,
  ShieldCheck,
  MousePointer2,
  Chrome,
  Accessibility,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type AppVersion = 'web' | 'desktop';

export default function App() {
  const [activeVersion, setActiveVersion] = useState<AppVersion>('web');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [notification, setNotification] = useState<{title: string, msg: string} | null>(null);

  const showToast = (title: string, msg: string) => {
    setNotification({ title, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const processText = useCallback(async (mode: 'grammar' | 'rewrite' | 'casual') => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setOutput('');
    
    let toastMsg = "Refining your writing...";
    if (mode === 'grammar') toastMsg = "Freezing grammar errors...";
    if (mode === 'casual') toastMsg = "Making it more human...";
    
    showToast("Snowwriter", toastMsg);

    let systemInstruction = "";
    if (mode === 'grammar') {
      systemInstruction = "You are a strict grammar checker. Fix the grammar of the following text. Do not add explanations or conversational filler, just return the fixed text.";
    } else if (mode === 'rewrite') {
      systemInstruction = "You are an expert editor. Rewrite the following text to be highly professional, clear, and engaging. Do not add explanations or conversational filler, just return the rewritten text.";
    } else if (mode === 'casual') {
      systemInstruction = "You are a friendly writing assistant. Rewrite the following text to be casual, human-like, and conversational. Use a relaxed tone, but keep the core meaning. Do not add explanations or conversational filler, just return the rewritten text.";
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
          systemInstruction,
        },
      });

      setOutput(response.text || 'No response from AI.');
      showToast("Success", "Text has been refined.");
    } catch (error) {
      console.error('Error processing text:', error);
      setOutput('Error: Failed to process text. Please try again.');
      showToast("Error", "Failed to reach the AI engine.");
    } finally {
      setIsProcessing(false);
    }
  }, [input, isProcessing]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [output]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 icy-gradient">
      {/* Toast Notification Simulation */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-6 right-6 z-50 glass-card p-4 rounded-xl border-l-4 border-l-ice-500 flex items-start gap-3 w-72"
          >
            <div className="bg-ice-100 p-2 rounded-lg">
              <Snowflake className="w-5 h-5 text-ice-600" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-ice-900">{notification.title}</h4>
              <p className="text-xs text-ice-600 mt-1">{notification.msg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between mb-12 gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl frozen-glow">
              <PenLine className="w-8 h-8 text-ice-600" />
            </div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute -top-3 -right-3"
            >
              <Snowflake className="w-8 h-8 text-ice-400 fill-ice-100" />
            </motion.div>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-ice-900">Snowwriter</h1>
            <p className="text-sm text-ice-600 font-bold uppercase tracking-widest">AI Writing Suite</p>
          </div>
        </div>

        {/* Version Switcher */}
        <div className="flex bg-white/40 p-1.5 rounded-2xl border border-white/20 backdrop-blur-sm shadow-inner">
          <button 
            onClick={() => setActiveVersion('web')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeVersion === 'web' ? 'bg-white text-ice-600 shadow-md' : 'text-ice-400 hover:text-ice-600'}`}
          >
            <Globe className="w-4 h-4" />
            Web Editor
          </button>
          <button 
            onClick={() => setActiveVersion('desktop')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeVersion === 'desktop' ? 'bg-white text-ice-600 shadow-md' : 'text-ice-400 hover:text-ice-600'}`}
          >
            <Monitor className="w-4 h-4" />
            Desktop App
          </button>
        </div>
      </motion.header>

      <main className="w-full max-w-5xl flex-1">
        <AnimatePresence mode="wait">
          {activeVersion === 'web' ? (
            <motion.div 
              key="web-editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Side: Input */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="glass-card rounded-3xl p-8 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-ice-800 flex items-center gap-2">
                      <PenLine className="w-5 h-5 text-ice-500" />
                      Editor Workspace
                    </h2>
                    <button 
                      onClick={() => setInput('')}
                      className="text-ice-400 hover:text-ice-600 transition-colors p-2 hover:bg-ice-50 rounded-lg"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your text here to be refined by the Snowwriter engine..."
                    className="w-full h-64 bg-transparent border-none focus:ring-0 text-xl leading-relaxed resize-none placeholder:text-ice-200 scrollbar-thin scrollbar-thumb-ice-100"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-ice-100">
                    <button
                      onClick={() => processText('grammar')}
                      disabled={isProcessing || !input.trim()}
                      className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-ice-600 hover:bg-ice-700 disabled:bg-ice-300 text-white font-black transition-all shadow-lg hover:shadow-ice-200 active:scale-95 text-sm"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                      Grammar
                    </button>
                    <button
                      onClick={() => processText('rewrite')}
                      disabled={isProcessing || !input.trim()}
                      className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-white hover:bg-ice-50 disabled:bg-white/50 text-ice-600 border-2 border-ice-600 font-black transition-all shadow-lg active:scale-95 text-sm"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-3 border-ice-600/30 border-t-ice-600 rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      Professional
                    </button>
                    <button
                      onClick={() => processText('casual')}
                      disabled={isProcessing || !input.trim()}
                      className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-ice-100 hover:bg-ice-200 disabled:bg-ice-50 text-ice-700 font-black transition-all shadow-lg active:scale-95 text-sm"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-3 border-ice-700/30 border-t-ice-700 rounded-full animate-spin" />
                      ) : (
                        <Coffee className="w-5 h-5" />
                      )}
                      Casual
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side: Output */}
              <div className="lg:col-span-5">
                <AnimatePresence mode="wait">
                  {output ? (
                    <motion.div 
                      key="output"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-card rounded-3xl p-8 flex flex-col gap-6 border-ice-200 h-full"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-ice-800 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-ice-500" />
                          Refined Result
                        </h2>
                        <button 
                          onClick={handleCopy}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ice-100 hover:bg-ice-200 text-ice-700 text-sm font-black transition-all"
                        >
                          {copySuccess ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          {copySuccess ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="text-lg leading-relaxed text-ice-900 whitespace-pre-wrap flex-1 italic">
                        "{output}"
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-ice-200 rounded-3xl bg-white/20"
                    >
                      <div className="w-16 h-16 bg-ice-100 rounded-full flex items-center justify-center mb-4">
                        <Zap className="w-8 h-8 text-ice-300" />
                      </div>
                      <h3 className="text-ice-800 font-bold mb-2">Ready to Refine</h3>
                      <p className="text-ice-400 text-sm">Input your text and choose a mode to see the Snowwriter magic.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="desktop-guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left: Background App Concept */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="glass-card rounded-3xl p-8 flex flex-col gap-6">
                  <div className="w-16 h-16 bg-ice-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Monitor className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-ice-900">Snowwriter Desktop</h2>
                    <p className="text-ice-600 mt-2 font-medium">The background engine for Windows.</p>
                  </div>
                  
                  <div className="space-y-4 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-ice-100 p-1.5 rounded-lg mt-1">
                        <Zap className="w-4 h-4 text-ice-600" />
                      </div>
                      <div>
                        <p className="font-bold text-ice-800 text-sm">System-Wide</p>
                        <p className="text-xs text-ice-500">Works in Word, Slack, Chrome, and more.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-ice-100 p-1.5 rounded-lg mt-1">
                        <ShieldCheck className="w-4 h-4 text-ice-600" />
                      </div>
                      <div>
                        <p className="font-bold text-ice-800 text-sm">100% Private</p>
                        <p className="text-xs text-ice-500">Runs locally on your PC. No data leaves.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-ice-100 p-1.5 rounded-lg mt-1">
                        <MousePointer2 className="w-4 h-4 text-ice-600" />
                      </div>
                      <div>
                        <p className="font-bold text-ice-800 text-sm">Zero UI</p>
                        <p className="text-xs text-ice-500">Stays in the tray until you need it.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Technical Roadmap */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="glass-card rounded-3xl p-8 flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-ice-900 flex items-center gap-3">
                      <Info className="w-6 h-6 text-ice-500" />
                      How to Build the Background Version
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-ice-800 uppercase text-xs tracking-widest">1. Setup Environment</h4>
                      <div className="bg-white/50 p-4 rounded-2xl border border-ice-100 text-sm text-ice-700 space-y-2">
                        <p>• Use <strong>WinUI 3</strong> (Windows App SDK)</p>
                        <p>• Install <strong>LLamaSharp</strong> for local AI</p>
                        <p>• Install <strong>SharpHook</strong> for global keys</p>
                        <p>• Use <strong>InputSimulator</strong> for pasting</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-ice-800 uppercase text-xs tracking-widest">2. The Hotkey Loop</h4>
                      <div className="bg-ice-900 rounded-2xl p-5 overflow-x-auto">
                        <pre className="text-[10px] text-ice-100 font-mono leading-relaxed">
{`// Global Hotkey: Ctrl + Alt + S
private async void OnHotkey() {
  // 1. Copy Selected Text
  Simulate(Ctrl+C);
  
  // 2. Process with Gemma 2
  var text = Clipboard.GetText();
  var result = await Gemma.Fix(text);
  
  // 3. Replace Original
  Clipboard.SetText(result);
  Simulate(Ctrl+V);
}`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-ice-800 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4 text-ice-500" />
                        Low-End Model Support
                      </h4>
                      <div className="bg-white/50 p-4 rounded-2xl border border-ice-100 text-sm text-ice-700 space-y-2">
                        <p>• <strong>Gemma 2 2B</strong> or <strong>Phi-3 Mini</strong> are perfect</p>
                        <p>• Runs smoothing on <strong>8GB RAM</strong> laptops</p>
                        <p>• Fast response even on integrated graphics</p>
                        <p>• Highly accurate for grammar & style fixes</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-ice-800 uppercase text-xs tracking-widest flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-ice-500" />
                        Tool Requirements
                      </h4>
                      <div className="bg-white/50 p-4 rounded-2xl border border-ice-100 text-sm text-ice-700 space-y-2">
                        <p>• <strong>No extra tools</strong> required for end-users</p>
                        <p>• Dev: <strong>Visual Studio 2022</strong> + NuGet</p>
                        <p>• Deployment: <strong>Store MSIX</strong> (bundled model)</p>
                        <p>• Updates: Automatic via Microsoft Store</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-ice-800 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Chrome className="w-4 h-4 text-ice-500" />
                        Chrome Extension
                      </h4>
                      <div className="bg-white/50 p-4 rounded-2xl border border-ice-100 text-sm text-ice-700 space-y-2">
                        <p>• Use <strong>Content Scripts</strong> to read text areas</p>
                        <p>• Inject a <strong>"Snowwriter" button</strong> next to inputs</p>
                        <p>• Use <code>chrome.runtime</code> to communicate</p>
                        <p>• Port our <strong>AI logic</strong> to bridge the API</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-ice-800 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Accessibility className="w-4 h-4 text-ice-500" />
                        Live Screen Support
                      </h4>
                      <div className="bg-white/50 p-4 rounded-2xl border border-ice-100 text-sm text-ice-700 space-y-2">
                        <p>• Use <strong>UI Automation API</strong> (Accessibility)</p>
                        <p>• Passively <strong>scan focused elements</strong></p>
                        <p>• Use <code>AutomationElement.FocusedElement</code></p>
                        <p>• Highlight errors with a <strong>Transparent Overlay</strong></p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-ice-50 p-6 rounded-2xl border border-ice-200 flex flex-col md:flex-row items-center gap-6">
                    <div className="hidden md:block">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                        <Zap className="w-8 h-8 text-ice-500" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-ice-900 mb-1">Self-Contained Bundling</h4>
                      <p className="text-sm text-ice-600 leading-relaxed">
                        Yes! When you build the <strong>MSIX package</strong>, everything is bundled together. To include the AI model, simply add the <code>.gguf</code> file to your Visual Studio project and set its properties to <strong>"Content"</strong> and <strong>"Copy if newer"</strong>. The installer will include the model, so users have everything they need immediately—no extra downloads required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mt-16 pb-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-ice-200 pt-12">
        <div className="flex items-center gap-3 text-ice-400 text-sm font-medium">
          <Snowflake className="w-5 h-5" />
          <span>Snowwriter Suite © 2026 • Powered by Gemini & Gemma</span>
        </div>
        <div className="flex gap-8 text-sm font-black text-ice-500">
          <a href="#" className="hover:text-ice-900 transition-colors">Documentation</a>
          <a href="#" className="hover:text-ice-900 transition-colors">API Status</a>
          <a href="#" className="hover:text-ice-900 transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
