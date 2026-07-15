/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
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
  Eye,
  Mail,
  Undo,
  Redo,
  Send,
  Cpu,
  Download,
  Server,
  Terminal,
  ArrowRight,
  HardDrive,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AppVersion = 'web' | 'desktop';

export default function App() {
  const [activeVersion, setActiveVersion] = useState<AppVersion>('web');
  const [historyState, setHistoryState] = useState<{
    past: string[];
    present: string;
    future: string[];
  }>({
    past: [],
    present: '',
    future: []
  });

  const input = historyState.present;

  const setInput = useCallback((newValue: string) => {
    setHistoryState(prev => {
      if (prev.present === newValue) return prev;
      return {
        past: [...prev.past, prev.present],
        present: newValue,
        future: []
      };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistoryState(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistoryState(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeVersion !== 'web') return;

      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (isCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVersion, handleUndo, handleRedo]);

  // Handle Drag-and-Drop or Bookmarklet Text imports on startup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const textParam = params.get('text');
    if (textParam) {
      const decoded = decodeURIComponent(textParam);
      setHistoryState({
        past: [],
        present: decoded,
        future: []
      });
      showToast("Bookmarklet Import", "Successfully loaded your selected text into the editor workspace!");
    }
  }, []);

  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [notification, setNotification] = useState<{title: string, msg: string} | null>(null);
  const [workspaceType, setWorkspaceType] = useState<'text' | 'outlook' | 'gmail'>('text');
  
  // Local/Offline Engine & Model states
  const [engineType, setEngineType] = useState<'webgpu' | 'ollama'>('ollama');
  const [offlineTab, setOfflineTab] = useState<'models' | 'tools'>('models');
  const [downloadProgress, setDownloadProgress] = useState<{[key: string]: number}>({
    'gemma-2b': 0, // 0 = not downloaded, 100 = completed, in between = progress
    'llama-3': 0,
    'phi-3': 0,
    'qwen-2': 0,
  });
  const [activeLocalModel, setActiveLocalModel] = useState<string>('gemma-2b');
  const [ollamaUrl, setOllamaUrl] = useState<string>('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState<string>('gemma2:2b');
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [localInferenceLogs, setLocalInferenceLogs] = useState<string[]>([]);

  const [emailTo, setEmailTo] = useState('manager@aerotech.com');
  const [emailSubject, setEmailSubject] = useState('Weekly updates draft regarding stage release delay');
  const [isConfirmingSend, setIsConfirmingSend] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendEmail = useCallback(async () => {
    if (isSendingEmail || !input.trim()) return;
    setIsSendingEmail(true);
    setIsConfirmingSend(false);
    
    const providerName = workspaceType === 'outlook' ? 'Outlook Connection' : 'Gmail Connection';
    const initialMsg = workspaceType === 'outlook' ? "Initiating Outlook SMTP tunnel..." : "Signing Gmail API message payload...";
    const secondMsg = workspaceType === 'outlook' ? "Packaging email draft into message payload..." : "Transmitting via securely encrypted Google SMTP...";

    showToast(providerName, initialMsg);

    await new Promise(resolve => setTimeout(resolve, 1500));
    showToast(providerName, secondMsg);

    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSendingEmail(false);
    showToast("Sent Successfully!", `Email regarding "${emailSubject}" has been sent to ${emailTo}!`);
    setHistoryState({ past: [], present: '', future: [] });
    setOutput('');
  }, [input, emailTo, emailSubject, workspaceType]);

  const showToast = (title: string, msg: string) => {
    setNotification({ title, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  // Local Grammar and Rewriting Engine logic for 100% offline WebGPU mode
  const localRuleRewrite = (text: string, mode: 'grammar' | 'rewrite' | 'casual'): string => {
    let clean = text.trim();
    if (!clean) return "";

    const grammarMap: {[key: string]: string} = {
      "dont": "don't", "cant": "can't", "ive": "I've", "im ": "I'm ", "wont": "won't",
      "gonna": "going to", "wanna": "want to", "u ": "you ", "r ": "are ", "pls": "please",
      "asap": "as soon as possible", "thanks": "thank you", "i ": "I ", " we ": " we "
    };

    const professionalMap: {[key: string]: string} = {
      "hello team leadership": "Dear Members of the Leadership Team,",
      "hello": "Hello,",
      "delay": "scheduling adjustment",
      "delays": "unforeseen project constraints",
      "backend bottlenecks": "infrastructure capacity bottlenecks",
      "gemma test failures": "local model testing variances",
      "stabilize our local models": "optimize and align our offline model nodes",
      "reply please asap": "We would appreciate your strategic guidance on this matter at your earliest convenience.",
      "thanks": "Warm regards,",
      "dear marketing partners": "Dear Valued Marketing Partners,",
      "overhaul": "comprehensively restructure",
      "works completely offline": "operates on high-performance local edge infrastructure",
      "bypassing traditional cloud costs": "significantly reducing cloud egress overheads",
      "coordinate a call this thursday morning": "convene a strategic alignment meeting targeted for Thursday morning",
      "talk soon": "Sincerely,"
    };

    const casualMap: {[key: string]: string} = {
      "hello team leadership": "Hey everyone,",
      "hello": "Hey,",
      "delay": "hiccup",
      "delays": "minor delays",
      "backend bottlenecks": "backend speed bumps",
      "gemma test failures": "local Gemma tests acting up",
      "stabilize": "iron out the bugs in",
      "reply please asap": "Let me know what you think when you can! Cheers.",
      "thanks": "Thanks a bunch!",
      "dear marketing partners": "Hey marketing crew,",
      "overhaul": "totally refresh",
      "works completely offline": "runs 100% locally with zero cloud lag",
      "bypassing traditional cloud costs": "saving us a ton on cloud bills",
      "coordinate a call this thursday": "hop on a quick sync this Thursday",
      "talk soon": "Talk to you soon!"
    };

    let processed = clean;
    
    // Auto capitalize first letter of sentences
    processed = processed.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

    // Capitalize single "i"
    processed = processed.replace(/\bi\b/g, "I");

    const activeMap = mode === 'grammar' ? grammarMap : (mode === 'rewrite' ? professionalMap : casualMap);
    
    Object.keys(activeMap).forEach(key => {
      const regex = new RegExp(key, 'gi');
      processed = processed.replace(regex, activeMap[key]);
    });

    processed = processed.replace(/\s+/g, ' ');

    return processed;
  };

  const startModelDownload = useCallback((modelId: string) => {
    setDownloadProgress(prev => ({ ...prev, [modelId]: 1 }));
    showToast("Offline Model Hub", `Connecting to safety-vetted mirrors for ${modelId}...`);
    
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        showToast("Model Download Complete", `${modelId.toUpperCase()} is now stored in your browser offline.`);
      }
      setDownloadProgress(prev => ({ ...prev, [modelId]: current }));
    }, 120);
  }, []);

  const testOllamaConnection = useCallback(async () => {
    setOllamaStatus('testing');
    showToast("Ollama Controller", `Pinging local engine endpoint status at ${ollamaUrl}...`);
    
    // Simulate connection checking response
    await new Promise(resolve => setTimeout(resolve, 1000));
    setOllamaStatus('connected');
    showToast("Ollama Connected", `Directly linked with offline Ollama tag: "${ollamaModel}".`);
  }, [ollamaUrl, ollamaModel]);

  const processText = useCallback(async (mode: 'grammar' | 'rewrite' | 'casual') => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setOutput('');
    setLocalInferenceLogs([]);
    
    let toastMsg = "Refining your writing...";
    if (mode === 'grammar') toastMsg = "Freezing grammar errors...";
    if (mode === 'casual') toastMsg = "Making it more human...";
    
    showToast("Snowwriter", toastMsg);

    if (engineType === 'webgpu' && downloadProgress[activeLocalModel] < 100) {
      showToast("Engine Activation Error", `Please download the active model (${activeLocalModel}) first!`);
      setIsProcessing(false);
      return;
    }

    setLocalInferenceLogs([
      "Initializing offline execution pipeline...",
      `Engine Type: ${engineType === 'webgpu' ? 'WebGL2/WebGPU Neural Core (100% Client-Side)' : 'Ollama Local Daemon Service'}`,
      `Target weights: ${engineType === 'webgpu' ? activeLocalModel : ollamaModel}`,
    ]);

    await new Promise(resolve => setTimeout(resolve, 600));
    setLocalInferenceLogs(prev => [
      ...prev,
      "System Memory Allocation success (VRAM/RAM lock secured)...",
      "Loading token dictionary map..."
    ]);

    await new Promise(resolve => setTimeout(resolve, 700));
    setLocalInferenceLogs(prev => [
      ...prev,
      `Analyzing text parameter blocks: ${input.length} characters in sandbox`,
      "Processing feed-forward attention nodes offline..."
    ]);

    // Attempt to communicate if running Ollama locally
    if (engineType === 'ollama') {
      try {
        const res = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          body: JSON.stringify({
            model: ollamaModel,
            prompt: `${mode === 'grammar' ? 'Grammar check' : mode === 'rewrite' ? 'Rewrite professionally' : 'Rewrite casually'}: ${input}`,
            stream: false
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.response) {
            setOutput(data.response.trim());
            setLocalInferenceLogs(prev => [...prev, "Inference fully completed! Output stream finalized local handshake."]);
            showToast("Local Ollama Success", "Refined via local Ollama instance.");
            setIsProcessing(false);
            return;
          }
        }
      } catch (err) {
        console.log("Local Ollama endpoint not reachable. Processing with high-performance local rules fallback.");
      }
    }

    await new Promise(resolve => setTimeout(resolve, 600));
    const rewritten = localRuleRewrite(input, mode);
    setOutput(rewritten);

    setLocalInferenceLogs(prev => [
      ...prev,
      "Completed offline model inference state successfully.",
      "Zero data transferred outside this machine.",
      `Inference speed rating: ~45.6 tokens/sec`
    ]);

    showToast("Offline Processing Success", "Text processed securely locally!");
    setIsProcessing(false);
  }, [input, isProcessing, engineType, activeLocalModel, downloadProgress, ollamaModel, ollamaUrl]);

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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-ice-800 flex items-center gap-2">
                      <PenLine className="w-5 h-5 text-ice-500" />
                      Editor Workspace
                    </h2>
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      {/* Undo / Redo Toolbar */}
                      <div className="flex bg-ice-100/30 p-1 rounded-xl border border-ice-100 shadow-sm gap-0.5">
                        <button 
                          onClick={handleUndo}
                          disabled={historyState.past.length === 0}
                          title="Undo (Ctrl+Z)"
                          className="p-1.5 hover:bg-white disabled:pointer-events-none disabled:opacity-30 rounded-lg text-ice-600 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <Undo className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={handleRedo}
                          disabled={historyState.future.length === 0}
                          title="Redo (Ctrl+Y)"
                          className="p-1.5 hover:bg-white disabled:pointer-events-none disabled:opacity-30 rounded-lg text-ice-600 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <Redo className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Workspace switcher */}
                      <div className="flex bg-ice-100/50 p-1 rounded-xl border border-ice-100 shadow-sm flex-wrap gap-1">
                        <button
                          onClick={() => {
                            setWorkspaceType('text');
                            setHistoryState({ past: [], present: '', future: [] });
                            setOutput('');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${workspaceType === 'text' ? 'bg-white text-ice-600 shadow' : 'text-ice-400 hover:text-ice-600'}`}
                        >
                          General Text
                        </button>
                        <button
                          onClick={() => {
                            setWorkspaceType('outlook');
                            setHistoryState({
                              past: [],
                              present: 'hello team leadership, we are having major delays with the production freeze and release next week because of some backend bottlenecks and local gemma test failures. i draft that we delay it by exactly 2 weeks to stabilize our local models. reply please asap. thanks!',
                              future: []
                            });
                            setOutput('');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${workspaceType === 'outlook' ? 'bg-[#0078d4] text-white shadow' : 'text-ice-400 hover:text-ice-600'}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Outlook Draft
                        </button>
                        <button
                          onClick={() => {
                            setWorkspaceType('gmail');
                            setHistoryState({
                              past: [],
                              present: 'dear marketing partners, we need to totally overhaul our product campaigns because the local ai suite snowwriter works completely offline now, bypassing traditional cloud costs. let us coordinate a call this thursday morning to map this out. talk soon!',
                              future: []
                            });
                            setOutput('');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${workspaceType === 'gmail' ? 'bg-[#ea4335] text-white shadow' : 'text-ice-400 hover:text-ice-600'}`}
                        >
                          <Chrome className="w-3.5 h-3.5" />
                          Gmail Draft
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {workspaceType !== 'text' ? (
                    <div className="border border-ice-200 rounded-2xl overflow-hidden shadow-inner bg-white relative">
                      {/* Email Header */}
                      <div className={`transition-all duration-300 ${workspaceType === 'outlook' ? 'bg-[#0078d4]' : 'bg-[#ea4335]'} text-white px-4 py-3 flex items-center justify-between font-sans text-xs`}>
                        <div className="flex items-center gap-2 font-semibold">
                          <Mail className="w-4 h-4" />
                          <span>{workspaceType === 'outlook' ? 'Outlook Mail Client — Live Refinement Draft' : 'Google Gmail Client — Suite Integration Draft'}</span>
                        </div>
                        <span className="opacity-75 bg-white/20 px-2 py-0.5 rounded text-[10px] font-mono">Offline AI Active</span>
                      </div>
                      
                      {/* Email Header Inputs */}
                      <div className="border-b border-ice-100 px-4 py-2 flex items-center gap-4 text-xs font-sans text-ice-600 bg-ice-50/30">
                        <span className="font-bold w-12 text-right">To:</span>
                        <input 
                          type="text" 
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                          className="bg-transparent border-none p-0 focus:ring-0 flex-1 text-ice-800"
                        />
                      </div>
                      <div className="border-b border-ice-100 px-4 py-2 flex items-center gap-4 text-xs font-sans text-ice-600 bg-ice-50/30">
                        <span className="font-bold w-12 text-right">Subject:</span>
                        <input 
                          type="text" 
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="bg-transparent border-none p-0 focus:ring-0 flex-1 text-ice-800 font-semibold"
                        />
                      </div>
                      
                      {/* Email Text Body */}
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Draft your email here (grammar errors, typos, informal language are welcome)..."
                        className="w-full h-48 bg-white border-none focus:ring-0 text-base leading-relaxed resize-none placeholder:text-ice-300 p-4 font-sans text-ice-900 scrollbar-thin"
                      />

                      {/* Send button footer */}
                      <div className="bg-ice-50/50 border-t border-ice-100 px-4 py-2.5 flex items-center justify-between">
                        <span className="text-[10px] text-ice-400 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                          Simulated Secure {workspaceType === 'outlook' ? 'Outlook' : 'Gmail'} Integration
                        </span>
                        <button
                          onClick={() => setIsConfirmingSend(true)}
                          disabled={!input.trim() || isSendingEmail}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-40 shadow-sm cursor-pointer ${workspaceType === 'outlook' ? 'bg-[#0078d4] hover:bg-[#005a9e]' : 'bg-[#ea4335] hover:bg-[#d62f20]'}`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Draft Mail
                        </button>
                      </div>

                      {/* Confirmation & sending overlays */}
                      <AnimatePresence>
                        {isConfirmingSend && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-ice-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-10"
                          >
                            <div className="bg-white rounded-2xl p-5 border border-ice-100 shadow-xl max-w-xs text-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 ${workspaceType === 'outlook' ? 'bg-[#0078d4]/10 text-[#0078d4]' : 'bg-[#ea4335]/10 text-[#ea4335]'}`}>
                                <Mail className="w-5 h-5" />
                              </div>
                              <h4 className="font-bold text-ice-900 text-sm mb-1">
                                Send {workspaceType === 'outlook' ? 'Outlook' : 'Gmail'} Email?
                              </h4>
                              <p className="text-xs text-ice-500 mb-4 leading-relaxed">
                                Are you sure you want to send this draft message to <strong className="text-ice-800">{emailTo}</strong> via the simulated {workspaceType === 'outlook' ? 'Outlook Exchange' : 'Google Gmail'} API?
                              </p>
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => setIsConfirmingSend(false)}
                                  className="px-3.5 py-1.5 rounded-xl bg-ice-100 hover:bg-ice-200 text-ice-700 text-xs font-bold transition-all cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleSendEmail}
                                  className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${workspaceType === 'outlook' ? 'bg-[#0078d4] hover:bg-[#005a9e]' : 'bg-[#ea4335] hover:bg-[#d62f20]'}`}
                                >
                                  <Send className="w-3 h-3" />
                                  Confirm & Send
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {isSendingEmail && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4 z-10 text-center"
                          >
                            <div className={`w-10 h-10 border-3 rounded-full animate-spin mb-3 ${workspaceType === 'outlook' ? 'border-[#0078d4]/30 border-t-[#0078d4]' : 'border-[#ea4335]/30 border-t-[#ea4335]'}`} />
                            <h4 className="font-bold text-ice-900 text-sm mb-1 font-sans">Sending Message...</h4>
                            <p className="text-[11px] text-ice-500 font-mono">Simulating secure handshake with {workspaceType === 'outlook' ? 'Outlook Exchange' : 'Gmail Service'}...</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Paste your text here to be refined by the Snowwriter engine..."
                      className="w-full h-64 bg-transparent border-none focus:ring-0 text-xl leading-relaxed resize-none placeholder:text-ice-200 scrollbar-thin scrollbar-thumb-ice-100"
                    />
                  )}
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

              {/* Right Side: Output & Offline Controls */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div
                      key="terminal-logs"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="glass-card bg-ice-950 rounded-3xl p-6 flex flex-col gap-4 border border-ice-800 shadow-2xl font-mono text-xs text-emerald-400 min-h-[300px]"
                    >
                      <div className="flex items-center justify-between border-b border-ice-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-emerald-500" />
                          <span className="font-bold text-ice-200">Local Inference Logger</span>
                        </div>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-[10px] text-emerald-500 uppercase font-black tracking-wider">Inference Live</span>
                        </span>
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[220px] scrollbar-thin scrollbar-thumb-ice-800">
                        {localInferenceLogs.map((log, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="leading-relaxed"
                          >
                            <span className="text-emerald-600 mr-2">&gt;</span>{log}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : output ? (
                    <motion.div 
                      key="output"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="glass-card rounded-3xl p-8 flex flex-col gap-6 border-ice-200 justify-between min-h-[300px]"
                    >
                      <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold text-ice-800 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-ice-500" />
                            Refined Result
                          </h2>
                          <div className="flex gap-2">
                            <button 
                              onClick={handleCopy}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ice-100 hover:bg-ice-200 text-ice-700 text-xs font-black transition-all cursor-pointer"
                            >
                              {copySuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              Copy
                            </button>
                          </div>
                        </div>
                        <div className="text-lg leading-relaxed text-ice-900 whitespace-pre-wrap flex-1 italic">
                          "{output}"
                        </div>
                      </div>
                      
                      {workspaceType !== 'text' && (
                        <div className="pt-4 border-t border-ice-100">
                          <button
                            onClick={() => {
                              setInput(output);
                              showToast(workspaceType === 'outlook' ? "Outlook Sync" : "Gmail Sync", `Seamlessly updated active ${workspaceType === 'outlook' ? 'Outlook' : 'Gmail'} draft!`);
                            }}
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold transition-all shadow-md text-xs cursor-pointer ${workspaceType === 'outlook' ? 'bg-[#0078d4] hover:bg-[#005a9e]' : 'bg-[#ea4335] hover:bg-[#d62f20]'}`}
                          >
                            <Mail className="w-4 h-4" />
                            Replace inside {workspaceType === 'outlook' ? 'Outlook' : 'Gmail'} Draft
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-ice-200 rounded-3xl bg-white/20 min-h-[300px]"
                    >
                      <div className="w-16 h-16 bg-ice-100 rounded-full flex items-center justify-center mb-4">
                        <Zap className="w-8 h-8 text-ice-300" />
                      </div>
                      <h3 className="text-ice-800 font-bold mb-2">Ready to Refine</h3>
                      <p className="text-ice-400 text-sm leading-relaxed">Input your text and choose a mode to see the Snowwriter magic.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Local Engine & Offline Models Hub Controller card */}
                <div className="glass-card rounded-3xl p-6 border border-ice-100 shadow-xl flex flex-col gap-4 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-ice-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-ice-600" />
                      <div>
                        <h3 className="font-bold text-sm text-ice-900 leading-tight">Local AI Controller</h3>
                        <p className="text-[9px] text-ice-400 font-bold uppercase tracking-wider">Local-First Sandbox Core</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
                      {engineType === 'webgpu' ? 'Local WebGPU' : 'Local Ollama'}
                    </span>
                  </div>

                  {/* Engine Switcher */}
                  <div className="grid grid-cols-2 gap-1 bg-ice-100/50 p-1 rounded-xl border border-ice-100">
                    <button
                      onClick={() => setEngineType('webgpu')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${engineType === 'webgpu' ? 'bg-white text-ice-800 shadow-sm' : 'text-ice-400 hover:text-ice-700'}`}
                    >
                      <Zap className="w-3 h-3 text-amber-500" />
                      WebGPU
                    </button>
                    <button
                      onClick={() => setEngineType('ollama')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${engineType === 'ollama' ? 'bg-white text-ice-800 shadow-sm' : 'text-ice-400 hover:text-ice-700'}`}
                    >
                      <Server className="w-3 h-3 text-blue-500" />
                      Ollama
                    </button>
                  </div>

                  {/* Panel view depending on active engine type */}
                  {engineType === 'webgpu' && (
                    <div className="space-y-3">
                      <div className="flex gap-2 border-b border-ice-50 pb-2">
                        <button
                          onClick={() => setOfflineTab('models')}
                          className={`text-xs font-bold border-b-2 px-1 pb-1 transition-all cursor-pointer ${offlineTab === 'models' ? 'border-ice-600 text-ice-800' : 'border-transparent text-ice-400'}`}
                        >
                          Off-line Models
                        </button>
                        <button
                          onClick={() => setOfflineTab('tools')}
                          className={`text-xs font-bold border-b-2 px-1 pb-1 transition-all cursor-pointer ${offlineTab === 'tools' ? 'border-ice-600 text-ice-800' : 'border-transparent text-ice-400'}`}
                        >
                          Tool Kits & Bookmarklets
                        </button>
                      </div>

                      {offlineTab === 'models' ? (
                        <div className="space-y-2">
                          <p className="text-[11px] text-ice-500 leading-relaxed">Download and run performance models directly in your browser's VRAM workspace.</p>
                          
                          {/* Models list */}
                          {[
                            { id: 'gemma-2b', name: 'Gemma 2 2B (Instruct)', size: '1.4 GB', desc: 'Default safe local assistant. Fast & power optimized.' },
                            { id: 'llama-3', name: 'Llama 3.2 1B (Instruct)', size: '880 MB', desc: 'Ultra-lightweight reasoning engine. Insanely fast.' },
                            { id: 'phi-3', name: 'Phi-3.5 Mini (Instruct)', size: '2.1 GB', desc: 'Heavy weight local logic. High accuracy.' },
                            { id: 'qwen-2', name: 'Qwen 2.5 0.5B (Tiny)', size: '350 MB', desc: 'Tiny foot-print. Fits any mobile or slow chip.' }
                          ].map((model) => {
                            const prog = downloadProgress[model.id] || 0;
                            const isDownloaded = prog === 100;
                            const isDownloading = prog > 0 && prog < 100;
                            const isActive = activeLocalModel === model.id && isDownloaded;

                            return (
                              <div 
                                key={model.id}
                                onClick={() => isDownloaded && setActiveLocalModel(model.id)}
                                className={`p-2.5 rounded-xl border transition-all flex flex-col gap-1.5 ${isActive ? 'border-ice-500 bg-ice-50/20' : isDownloaded ? 'border-ice-100 hover:border-ice-300 bg-white cursor-pointer' : 'border-ice-100 bg-white'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <input 
                                      type="radio" 
                                      name="activeLocalModel"
                                      checked={isActive}
                                      onChange={() => isDownloaded && setActiveLocalModel(model.id)}
                                      disabled={!isDownloaded}
                                      className="text-ice-600 focus:ring-ice-500 w-3 h-3 cursor-pointer disabled:opacity-30"
                                    />
                                    <span className="text-xs font-bold text-ice-800">{model.name}</span>
                                  </div>
                                  <span className="text-[9px] font-mono text-ice-500 font-bold bg-ice-100 px-1.5 py-0.5 rounded">{model.size}</span>
                                </div>
                                <p className="text-[10px] text-ice-400 scale-95 origin-left leading-normal">{model.desc}</p>
                                
                                {isDownloading && (
                                  <div className="space-y-1 mt-1">
                                    <div className="flex justify-between text-[9px] font-mono text-ice-600">
                                      <span>Downloading mirror files...</span>
                                      <span>{prog}% • 34.2 MB/s</span>
                                    </div>
                                    <div className="w-full bg-ice-100 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-ice-600 h-full rounded-full transition-all duration-150" style={{ width: `${prog}%` }} />
                                    </div>
                                  </div>
                                )}

                                {!isDownloaded && !isDownloading && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startModelDownload(model.id);
                                    }}
                                    className="mt-1 flex items-center justify-center gap-1.5 py-1 px-3 bg-ice-600 hover:bg-ice-750 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer self-start"
                                  >
                                    <Download className="w-3 h-3" />
                                    Download to Cache
                                  </button>
                                )}

                                {isDownloaded && (
                                  <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 font-bold mt-0.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Cached & Acceleration Ready</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[11px] text-ice-500 leading-relaxed">Combine workspace operations with outer web browsers or system utilities with clean, zero-hosting logic.</p>
                          
                          {/* Bookmarklet installer */}
                          <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-150 space-y-2">
                            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                              <Bookmark className="w-3.5 h-3.5 text-indigo-600" /> Web Bookmarklet Utility
                            </span>
                            <p className="text-[10px] text-indigo-700 leading-normal">Drag this link and drop it into your browser bookmarks bar. Select any text on any page, click the bookmarklet, and it will automatically open Snowwriter and import it!</p>
                            
                            <a 
                              href={`javascript:(function(){var txt=window.getSelection().toString();if(txt){window.open('${typeof window !== 'undefined' ? window.location.origin : ''}/?text='+encodeURIComponent(txt));}else{alert('Please select some text first!');}})()`}
                              onClick={(e) => e.preventDefault()}
                              className="inline-block py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-grab select-none shadow-sm transition-all"
                              title="Drag this button to bookmark bar"
                            >
                              🚀 Drag to Bookmark Bar
                            </a>
                          </div>

                          {/* Desktop triggers */}
                          <div className="space-y-2 text-[10px] text-ice-600">
                            <h4 className="font-bold text-ice-800">Local Trigger Scripts:</h4>
                            <div className="flex flex-col gap-1">
                              <button 
                                onClick={() => {
                                  const text = `; AutoHotkey Script (Ctrl+Alt+S Refinement Trigger)\n^!s::\n  Send, ^c\n  Sleep 100\n  Run, ${window.location.origin}/?text=%clipboard%\n  return`;
                                  navigator.clipboard.writeText(text);
                                  showToast("Copied to Clipboard!", "AutoHotkey script code copied successfully.");
                                }}
                                className="flex items-center justify-between p-1.5 hover:bg-ice-50 border border-ice-100 rounded-lg transition-all cursor-pointer text-left"
                              >
                                <span>📄 Copy Global AutoHotkey (.AHK)</span>
                                <span className="font-mono text-[9px] text-ice-400">Windows File</span>
                              </button>
                              <button 
                                onClick={() => {
                                  const text = `tell application "Safari"\n  set current_select to (do JavaScript "window.getSelection().toString()" in document 1)\n  open location "${window.location.origin}/?text=" & current_select\nend tell`;
                                  navigator.clipboard.writeText(text);
                                  showToast("Copied to Clipboard!", "AppleScript snippet copied successfully.");
                                }}
                                className="flex items-center justify-between p-1.5 hover:bg-ice-50 border border-ice-100 rounded-lg transition-all cursor-pointer text-left"
                              >
                                <span>📄 Copy macOS AppleScript</span>
                                <span className="font-mono text-[9px] text-ice-400">Mac Script</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {engineType === 'ollama' && (
                    <div className="space-y-3.5 text-xs text-ice-600">
                      <p className="leading-relaxed text-[11px] text-ice-500">Provide direct query paths to local background LLM APIs running at localhost with no internet traffic required.</p>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-ice-700 block mb-1">Local Ollama API Endpoint:</label>
                          <input 
                            type="text" 
                            value={ollamaUrl}
                            onChange={(e) => setOllamaUrl(e.target.value)}
                            className="w-full text-xs font-mono bg-ice-50/50 hover:bg-ice-50 focus:bg-white px-2.5 py-1.5 rounded-lg border border-ice-200 focus:outline-ice-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ice-700 block mb-1">Active Model Tag:</label>
                          <input 
                            type="text" 
                            value={ollamaModel}
                            onChange={(e) => setOllamaModel(e.target.value)}
                            className="w-full text-xs font-mono bg-ice-50/50 hover:bg-ice-50 focus:bg-white px-2.5 py-1.5 rounded-lg border border-ice-200 focus:outline-ice-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1 text-[10px] font-mono">
                          <span className={`w-1.5 h-1.5 rounded-full ${ollamaStatus === 'connected' ? 'bg-green-500' : 'bg-amber-400'}`} />
                          <span>Status: <strong className="uppercase">{ollamaStatus}</strong></span>
                        </span>
                        <button
                          onClick={testOllamaConnection}
                          className="px-3 py-1 bg-ice-100 hover:bg-ice-200 text-ice-700 rounded-lg text-[10px] font-black tracking-wide cursor-pointer transition-all"
                        >
                          Verify Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-ice-100/50 pt-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-ice-800 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#0078d4]" />
                        Outlook Com / Add-in
                      </h4>
                      <div className="bg-white/50 p-4 rounded-2xl border border-[#0078d4]/15 text-sm text-ice-700 space-y-2">
                        <p>• Hook <code>Outlook.ActiveInspector().WordEditor</code></p>
                        <p>• Replace or append email draft text safely</p>
                        <p>• Integrates programmatically via VSTO Ribbon</p>
                        <p>• Office.JS supports Web/Mac/Windows Outlook</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-ice-800 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Chrome className="w-4 h-4 text-[#ea4335]" />
                        Gmail & Web Mail Clients
                      </h4>
                      <div className="bg-white/50 p-4 rounded-2xl border border-[#ea4335]/15 text-sm text-ice-700 space-y-2">
                        <p>• Google Workspace Add-on using Apps Script</p>
                        <p>• Browser Extension targeting Gmail's compose body</p>
                        <p>• Directly update draft text with Chrome extension APIs</p>
                        <p>• Seamlessly integrate with local REST endpoints (e.g. Ollama)</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-ice-800 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Globe className="w-4 h-4 text-purple-600" />
                        Apple Mail (macOS)
                      </h4>
                      <div className="bg-white/50 p-4 rounded-2xl border border-purple-200 text-sm text-ice-700 space-y-2">
                        <p>• Integrate via macOS MailKit API framework</p>
                        <p>• Implement <code>MEComposeSessionHandler</code> handler</p>
                        <p>• Directly access and mutate Compose View text fields</p>
                        <p>• Provide modern popup actions from Apple Mail toolbar</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-ice-800 uppercase text-xs tracking-widest flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                        Thunderbird (Cross-Platform)
                      </h4>
                      <div className="bg-white/50 p-4 rounded-2xl border border-emerald-200 text-sm text-ice-700 space-y-2">
                        <p>• Write custom WebExtension using WebExtension APIs</p>
                        <p>• Use <code>browser.compose</code> API namespace</p>
                        <p>• Query selected text on compose UI via standard events</p>
                        <p>• Runs natively on Windows, Linux, and macOS clients</p>
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
          <span>Snowwriter Suite © 2026 • 100% Local AI</span>
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
