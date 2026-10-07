import type { RewriteMode } from './rewriter';

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_OLLAMA_MODEL = 'gemma2:2b';

const INSTRUCTIONS: Record<RewriteMode, string> = {
  grammar:
    'Fix spelling, grammar, and punctuation in the text. Keep the meaning, tone, and wording otherwise unchanged.',
  rewrite:
    'Rewrite the text in a clear, professional tone suitable for work email. Keep the meaning and all facts.',
  casual:
    'Rewrite the text in a friendly, casual tone. Keep the meaning and all facts.',
};

export function buildPrompt(text: string, mode: RewriteMode): string {
  return `${INSTRUCTIONS[mode]} Reply with only the revised text, no preamble or explanation.\n\nText:\n"""\n${text}\n"""`;
}

const trimUrl = (url: string) => url.replace(/\/+$/, '');

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Returns the model tags installed on the Ollama server. Throws if unreachable. */
export async function listModels(baseUrl: string, timeoutMs = 3000): Promise<string[]> {
  const res = await fetchWithTimeout(`${trimUrl(baseUrl)}/api/tags`, {}, timeoutMs);
  if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
  const data: { models?: { name: string }[] } = await res.json();
  return (data.models ?? []).map(m => m.name);
}

export async function generate(
  baseUrl: string,
  model: string,
  text: string,
  mode: RewriteMode,
  timeoutMs = 60000,
): Promise<string> {
  const res = await fetchWithTimeout(
    `${trimUrl(baseUrl)}/api/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: buildPrompt(text, mode), stream: false }),
    },
    timeoutMs,
  );
  if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
  const data: { response?: string } = await res.json();
  const out = data.response?.trim();
  if (!out) throw new Error('Ollama returned an empty response');
  return out;
}
