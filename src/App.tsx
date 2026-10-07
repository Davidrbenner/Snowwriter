/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Snowflake, 
  PenLine, 
  Sparkles, 
  CheckCircle2, 
  Copy,  
  Coffee,
  Zap,
  Chrome,
  Mail,
  Undo,
  Redo,
  Send,
  Cpu,
  Server,
  Terminal,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { emptyHistory, push, redo, undo, type History } from './lib/history';
import { ruleRewrite, type RewriteMode } from './lib/rewriter';
import { DEFAULT_OLLAMA_MODEL, DEFAULT_OLLAMA_URL, generate, listModels } from './lib/ollama';

type Mode = RewriteMode;
type PanelTab = 'ollama' | 'tools';
type OllamaStatus = 'idle' | 'testing' | 'connected' | 'failed';

const SAMPLE_DRAFTS = {
  outlook:
    'hey team, we are gonna have a delay on the release next week because of some backend issues and test failures. i think we should push it 2 weeks so we can fix things. pls get back to me asap. thanks',
  gmail:
    'hello, i wanted to check in regarding the marketing campaign. we need to figure out the budget before friday. can u send me the numbers? talk soon',
} as const;

const MODE_LABEL: Record<Mode, string> = {
  grammar: 'Fixing grammar',
  rewrite: 'Rewriting professionally',
  casual: 'Rewriting casually',
};

export default function App() {
  const [history, setHistory] = useState<History>(() => emptyHistory());
  const input = history.present;

  const setInput = useCallback((value: string) => setHistory(h => push(h, value)), []);
  const resetInput = useCallback((value = '') => setHistory(emptyHistory(value)), []);
  const handleUndo = useCallback(() => setHistory(undo), []);
  const handleRedo = useCallback(() => setHistory(redo), []);

  const [output, setOutput] = useState('');
  const [outputSource, setOutputSource] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [notification, setNotification] = useState<{ title: string; msg: string } | null>(null);
  const [workspaceType, setWorkspaceType] = useState<'text' | 'outlook' | 'gmail'>('text');

  const [panelTab, setPanelTab] = useState<PanelTab>('ollama');
  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL);
  const [ollamaModel, setOllamaModel] = useState(DEFAULT_OLLAMA_MODEL);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  // One timer for all toasts so a new toast isn't cut short by an older one's timeout.
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showToast = useCallback((title: string, msg: string) => {
    clearTimeout(toastTimer.current);
    setNotification({ title, msg });
    toastTimer.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  // Ctrl/Cmd+Z and Ctrl/Cmd+Y. Skip when focus is in a plain input so the
  // To/Subject fields keep native undo.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.target instanceof HTMLInputElement) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // Text passed in by the bookmarklet or hotkey scripts (?text=...).
  // URLSearchParams already decodes, so no second decodeURIComponent.
  useEffect(() => {
    const text = new URLSearchParams(window.location.search).get('text');
    if (text) {
      resetInput(text);
      showToast('Text imported', 'Loaded your selected text into the editor.');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [resetInput, showToast]);

  const testOllamaConnection = useCallback(async () => {
    setOllamaStatus('testing');
    try {
      const models = await listModels(ollamaUrl);
      setOllamaStatus('connected');
      showToast(
        'Ollama connected',
        models.includes(ollamaModel)
          ? `Model "${ollamaModel}" is installed and ready.`
          : `Connected, but "${ollamaModel}" is not installed. Run: ollama pull ${ollamaModel}`,
      );
    } catch {
      setOllamaStatus('failed');
      showToast('Ollama not reachable', `Could not reach ${ollamaUrl}. Is Ollama running?`);
    }
  }, [ollamaUrl, ollamaModel, showToast]);

  const processText = useCallback(
    async (mode: Mode) => {
      if (!input.trim() || isProcessing) return;
      setIsProcessing(true);
      setOutput('');
      const started = performance.now();
      const log = (line: string) => setLogs(prev => [...prev, line]);
      setLogs([`${MODE_LABEL[mode]} (${input.length} characters)`, `Sending to Ollama at ${ollamaUrl} using ${ollamaModel}`]);

      let result: string;
      let source: string;
      try {
        result = await generate(ollamaUrl, ollamaModel, input, mode);
        source = `Ollama, ${ollamaModel}`;
        setOllamaStatus('connected');
      } catch (err) {
        log(`Ollama failed: ${err instanceof Error ? err.message : 'unknown error'}`);
        log('Falling back to the built-in offline rules');
        result = ruleRewrite(input, mode);
        source = 'offline rules (no model)';
        setOllamaStatus('failed');
      }

      log(`Done in ${Math.round(performance.now() - started)} ms`);
      setOutput(result);
      setOutputSource(source);
      setIsProcessing(false);
    },
    [input, isProcessing, ollamaModel, ollamaUrl],
  );

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      showToast('Copy failed', 'Your browser blocked clipboard access.');
    }
  }, [output, showToast]);

  const copySnippet = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied', `${label} copied to your clipboard.`);
      } catch {
        showToast('Copy failed', 'Your browser blocked clipboard access.');
      }
    },
    [showToast],
  );

  // Hands the draft to the user's own mail client; nothing is sent from the app.
  const openInMailApp = useCallback(() => {
    const body = output || input;
    if (!body.trim()) return;
    const qs = new URLSearchParams({ subject: emailSubject, body }).toString().replace(/\+/g, '%20');
    window.location.href = `mailto:${encodeURIComponent(emailTo)}?${qs}`;
  }, [emailTo, emailSubject, input, output]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 icy-gradient">
      {/* Toast */}
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

      </motion.header>

      <main className="w-full max-w-5xl flex-1">
        <AnimatePresence mode="wait">
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
                          disabled={history.past.length === 0}
                          title="Undo (Ctrl+Z)"
                          className="p-1.5 hover:bg-white disabled:pointer-events-none disabled:opacity-30 rounded-lg text-ice-600 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <Undo className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={handleRedo}
                          disabled={history.future.length === 0}
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
                            resetInput();
                            setOutput('');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${workspaceType === 'text' ? 'bg-white text-ice-600 shadow' : 'text-ice-400 hover:text-ice-600'}`}
                        >
                          General Text
                        </button>
                        <button
                          onClick={() => {
                            setWorkspaceType('outlook');
                            resetInput(SAMPLE_DRAFTS.outlook);
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
                            resetInput(SAMPLE_DRAFTS.gmail);
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
                          <span>{workspaceType === 'outlook' ? 'Outlook-style draft' : 'Gmail-style draft'}</span>
                        </div>
                        <span className="opacity-75 bg-white/20 px-2 py-0.5 rounded text-[10px] font-mono">Local only</span>
                      </div>
                      
                      {/* Email Header Inputs */}
                      <div className="border-b border-ice-100 px-4 py-2 flex items-center gap-4 text-xs font-sans text-ice-600 bg-ice-50/30">
                        <span className="font-bold w-12 text-right">To:</span>
                        <input 
                          type="text" 
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                          placeholder="name@example.com"
                          className="bg-transparent border-none p-0 focus:ring-0 flex-1 text-ice-800"
                        />
                      </div>
                      <div className="border-b border-ice-100 px-4 py-2 flex items-center gap-4 text-xs font-sans text-ice-600 bg-ice-50/30">
                        <span className="font-bold w-12 text-right">Subject:</span>
                        <input 
                          type="text" 
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Subject"
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

                      {/* Mail client handoff */}
                      <div className="bg-ice-50/50 border-t border-ice-100 px-4 py-2.5 flex items-center justify-between gap-3">
                        <span className="text-[10px] text-ice-400">
                          Opens your default mail app with this draft. Nothing is sent from Snowwriter.
                        </span>
                        <button
                          onClick={openInMailApp}
                          disabled={!input.trim()}
                          className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-40 shadow-sm cursor-pointer ${workspaceType === 'outlook' ? 'bg-[#0078d4] hover:bg-[#005a9e]' : 'bg-[#ea4335] hover:bg-[#d62f20]'}`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Open in mail app
                        </button>
                      </div>
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
                          <span className="font-bold text-ice-200">Activity</span>
                        </div>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-[10px] text-emerald-500 uppercase font-black tracking-wider">Working</span>
                        </span>
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[220px] scrollbar-thin scrollbar-thumb-ice-800">
                        {logs.map((log, i) => (
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
                            Result
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
                        <div className="text-lg leading-relaxed text-ice-900 whitespace-pre-wrap flex-1">
                          {output}
                        </div>
                        <p className="text-[10px] text-ice-400 font-mono">Generated by {outputSource}</p>
                      </div>
                      
                      {workspaceType !== 'text' && (
                        <div className="pt-4 border-t border-ice-100">
                          <button
                            onClick={() => {
                              setInput(output);
                              showToast('Draft updated', 'The result replaced your draft. Undo with Ctrl+Z.');
                            }}
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold transition-all shadow-md text-xs cursor-pointer ${workspaceType === 'outlook' ? 'bg-[#0078d4] hover:bg-[#005a9e]' : 'bg-[#ea4335] hover:bg-[#d62f20]'}`}
                          >
                            <Mail className="w-4 h-4" />
                            Use as draft
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
                      <p className="text-ice-400 text-sm leading-relaxed">Enter text and pick a mode. Uses Ollama if it's running, otherwise basic offline rules.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Local model + tools card */}
                <div className="glass-card rounded-3xl p-6 border border-ice-100 shadow-xl flex flex-col gap-4 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-ice-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-ice-600" />
                      <h3 className="font-bold text-sm text-ice-900 leading-tight">Local AI</h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                        ollamaStatus === 'connected'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : ollamaStatus === 'failed'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-ice-50 text-ice-500 border-ice-100'
                      }`}
                    >
                      {ollamaStatus === 'connected' ? 'Ollama connected' : ollamaStatus === 'failed' ? 'Using offline rules' : ollamaStatus === 'testing' ? 'Checking...' : 'Not checked'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 bg-ice-100/50 p-1 rounded-xl border border-ice-100">
                    {(['ollama', 'tools'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setPanelTab(tab)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${panelTab === tab ? 'bg-white text-ice-800 shadow-sm' : 'text-ice-400 hover:text-ice-700'}`}
                      >
                        {tab === 'ollama' ? <Server className="w-3 h-3 text-blue-500" /> : <Bookmark className="w-3 h-3 text-indigo-500" />}
                        {tab === 'ollama' ? 'Ollama' : 'Shortcuts'}
                      </button>
                    ))}
                  </div>

                  {panelTab === 'ollama' ? (
                    <div className="space-y-3.5 text-xs text-ice-600">
                      <p className="leading-relaxed text-[11px] text-ice-500">
                        Snowwriter sends your text to an Ollama server on your machine. If it can't reach one, it falls back to basic offline rules.
                      </p>
                      <div className="space-y-2">
                        <label className="block">
                          <span className="text-[10px] font-bold text-ice-700 block mb-1">Ollama URL</span>
                          <input
                            type="text"
                            value={ollamaUrl}
                            onChange={e => {
                              setOllamaUrl(e.target.value);
                              setOllamaStatus('idle');
                            }}
                            className="w-full text-xs font-mono bg-ice-50/50 hover:bg-ice-50 focus:bg-white px-2.5 py-1.5 rounded-lg border border-ice-200 focus:outline-ice-500"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-bold text-ice-700 block mb-1">Model</span>
                          <input
                            type="text"
                            value={ollamaModel}
                            onChange={e => {
                              setOllamaModel(e.target.value);
                              setOllamaStatus('idle');
                            }}
                            className="w-full text-xs font-mono bg-ice-50/50 hover:bg-ice-50 focus:bg-white px-2.5 py-1.5 rounded-lg border border-ice-200 focus:outline-ice-500"
                          />
                        </label>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={testOllamaConnection}
                          disabled={ollamaStatus === 'testing'}
                          className="px-3 py-1 bg-ice-100 hover:bg-ice-200 disabled:opacity-50 text-ice-700 rounded-lg text-[10px] font-black tracking-wide cursor-pointer transition-all"
                        >
                          Test connection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                          <Bookmark className="w-3.5 h-3.5 text-indigo-600" /> Bookmarklet
                        </span>
                        <p className="text-[10px] text-indigo-700 leading-normal">
                          Drag this button to your bookmarks bar. Select text on any page, click the bookmark, and it opens in Snowwriter.
                        </p>
                        <a
                          href={`javascript:(function(){var t=window.getSelection().toString();if(t){window.open('${window.location.origin}/?text='+encodeURIComponent(t));}else{alert('Select some text first.');}})()`}
                          onClick={e => e.preventDefault()}
                          className="inline-block py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-grab select-none shadow-sm transition-all"
                          title="Drag to your bookmarks bar"
                        >
                          Send to Snowwriter
                        </a>
                      </div>
                      <div className="space-y-2 text-[10px] text-ice-600">
                        <h4 className="font-bold text-ice-800">Hotkey scripts</h4>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() =>
                              copySnippet(
                                `; Snowwriter: Ctrl+Alt+S sends the selected text\n^!s::\n  Send, ^c\n  Sleep 100\n  Run, ${window.location.origin}/?text=%clipboard%\n  return`,
                                'AutoHotkey script',
                              )
                            }
                            className="flex items-center justify-between p-1.5 hover:bg-ice-50 border border-ice-100 rounded-lg transition-all cursor-pointer text-left"
                          >
                            <span>Copy AutoHotkey script</span>
                            <span className="font-mono text-[9px] text-ice-400">Windows</span>
                          </button>
                          <button
                            onClick={() =>
                              copySnippet(
                                `tell application "Safari"\n  set sel to (do JavaScript "encodeURIComponent(window.getSelection().toString())" in document 1)\n  open location "${window.location.origin}/?text=" & sel\nend tell`,
                                'AppleScript',
                              )
                            }
                            className="flex items-center justify-between p-1.5 hover:bg-ice-50 border border-ice-100 rounded-lg transition-all cursor-pointer text-left"
                          >
                            <span>Copy AppleScript</span>
                            <span className="font-mono text-[9px] text-ice-400">macOS</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-xs text-ice-400 flex items-center gap-3">
        <Snowflake className="w-4 h-4" />
        <span>Snowwriter: local-first writing assistant</span>
        <a href="https://github.com/Davidrbenner/Snowwriter" className="hover:text-ice-600 underline">GitHub</a>
      </footer>
    </div>
  );
}
