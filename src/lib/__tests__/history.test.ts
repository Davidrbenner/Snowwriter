import { describe, expect, it } from 'vitest';
import { MAX_HISTORY, emptyHistory, push, redo, undo } from '../history';

describe('history', () => {
  it('undoes and redoes in order', () => {
    let h = push(push(emptyHistory(), 'a'), 'ab');
    h = undo(h);
    expect(h.present).toBe('a');
    h = undo(h);
    expect(h.present).toBe('');
    h = redo(redo(h));
    expect(h.present).toBe('ab');
  });

  it('ignores no-op pushes and clears redo on new input', () => {
    const h = push(emptyHistory(), 'a');
    expect(push(h, 'a')).toBe(h);
    const branched = push(undo(h), 'b');
    expect(branched.future).toEqual([]);
  });

  it('returns the same object when there is nothing to undo or redo', () => {
    const h = emptyHistory('x');
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });

  it('caps undo depth', () => {
    let h = emptyHistory();
    for (let i = 0; i < MAX_HISTORY + 50; i++) h = push(h, String(i));
    expect(h.past.length).toBe(MAX_HISTORY);
  });
});
