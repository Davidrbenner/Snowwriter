import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildPrompt, generate, listModels } from '../ollama';

const mockFetch = (body: unknown, ok = true, status = 200) =>
  vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(body) });

afterEach(() => vi.unstubAllGlobals());

describe('ollama client', () => {
  it('builds a prompt that asks for only the revised text', () => {
    const p = buildPrompt('hi', 'grammar');
    expect(p).toContain('Reply with only the revised text');
    expect(p).toContain('"""\nhi\n"""');
  });

  it('lists installed models and trims trailing slashes from the URL', async () => {
    const f = mockFetch({ models: [{ name: 'gemma2:2b' }] });
    vi.stubGlobal('fetch', f);
    await expect(listModels('http://localhost:11434/')).resolves.toEqual(['gemma2:2b']);
    expect(f.mock.calls[0][0]).toBe('http://localhost:11434/api/tags');
  });

  it('posts a non-streaming JSON request and returns trimmed output', async () => {
    const f = mockFetch({ response: '  Fixed text.  ' });
    vi.stubGlobal('fetch', f);
    await expect(generate('http://x', 'm', 'txt', 'rewrite')).resolves.toBe('Fixed text.');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('http://x/api/generate');
    expect(JSON.parse(init.body)).toMatchObject({ model: 'm', stream: false });
  });

  it('throws on HTTP errors and empty responses so the app can fall back', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 404));
    await expect(generate('http://x', 'm', 't', 'grammar')).rejects.toThrow('404');
    vi.stubGlobal('fetch', mockFetch({ response: '   ' }));
    await expect(generate('http://x', 'm', 't', 'grammar')).rejects.toThrow('empty');
  });
});
