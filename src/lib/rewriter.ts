export type RewriteMode = 'grammar' | 'rewrite' | 'casual';

type Rules = Record<string, string>;

// Shorthand and missing-apostrophe fixes applied in every mode.
const GRAMMAR: Rules = {
  dont: "don't",
  cant: "can't",
  wont: "won't",
  didnt: "didn't",
  doesnt: "doesn't",
  isnt: "isn't",
  wasnt: "wasn't",
  ive: "I've",
  im: "I'm",
  gonna: 'going to',
  wanna: 'want to',
  gotta: 'have to',
  u: 'you',
  ur: 'your',
  r: 'are',
  pls: 'please',
  plz: 'please',
  thx: 'thanks',
  asap: 'as soon as possible',
  btw: 'by the way',
  fyi: 'for your information',
};

const PROFESSIONAL: Rules = {
  hey: 'Hello',
  thanks: 'Thank you',
  'a lot of': 'many',
  'get back to': 'follow up with',
  'talk soon': 'Best regards',
  'figure out': 'determine',
  'look into': 'investigate',
  'check out': 'review',
};

const CASUAL: Rules = {
  hello: 'Hey',
  'thank you': 'Thanks',
  'as soon as possible': 'when you can',
  regarding: 'about',
  however: 'but',
  therefore: 'so',
  'in order to': 'to',
  utilize: 'use',
  'best regards': 'Talk soon',
  sincerely: 'Cheers',
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Compile a rule map into one alternation regex. Keys are sorted longest-first
 * so multi-word phrases win over their sub-words, and \b boundaries stop
 * partial matches like "u" inside "you".
 */
function compile(rules: Rules): (text: string) => string {
  const keys = Object.keys(rules).sort((a, b) => b.length - a.length);
  const lookup = new Map(keys.map(k => [k.toLowerCase(), rules[k]]));
  const re = new RegExp(`\\b(${keys.map(escape).join('|')})\\b`, 'gi');
  return text =>
    text.replace(re, match => {
      const out = lookup.get(match.toLowerCase()) ?? match;
      // Keep the original's leading capital so sentence starts survive.
      return /^[A-Z]/.test(match) ? out[0].toUpperCase() + out.slice(1) : out;
    });
}

const applyGrammar = compile(GRAMMAR);
const applyProfessional = compile(PROFESSIONAL);
const applyCasual = compile(CASUAL);

function normalize(text: string): string {
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/ +([,.!?;:])/g, '$1')
    .replace(/([,.!?;:])(?=[A-Za-z])/g, '$1 ')
    .replace(/\bi\b/g, 'I')
    .replace(/(^|[.!?]\s+|\n\s*)([a-z])/g, (_m, p, c: string) => p + c.toUpperCase())
    .trim();
}

/**
 * Offline fallback used when no local model is reachable. It is rule-based,
 * not an LLM: it fixes common shorthand and adjusts a few phrases for tone.
 */
export function ruleRewrite(text: string, mode: RewriteMode): string {
  if (!text.trim()) return '';
  let out = applyGrammar(text);
  if (mode === 'rewrite') out = applyProfessional(out);
  if (mode === 'casual') out = applyCasual(out);
  out = normalize(out);
  if (mode !== 'casual' && /[a-z0-9]$/i.test(out)) out += '.';
  return out;
}
