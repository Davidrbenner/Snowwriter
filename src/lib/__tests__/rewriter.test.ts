import { describe, expect, it } from 'vitest';
import { ruleRewrite } from '../rewriter';

describe('ruleRewrite', () => {
  it('returns empty string for blank input', () => {
    expect(ruleRewrite('   ', 'grammar')).toBe('');
  });

  it('fixes shorthand, capitalization, and the pronoun i', () => {
    expect(ruleRewrite('i dont think u r ready', 'grammar')).toBe("I don't think you are ready.");
  });

  it('does not rewrite letters inside other words', () => {
    // Earlier versions turned "you" into "yoyou" and "for" into "foare".
    expect(ruleRewrite('thank you for this', 'grammar')).toBe('Thank you for this.');
  });

  it('capitalizes each sentence and tidies spacing', () => {
    expect(ruleRewrite('hello there .  how are you?fine', 'grammar')).toBe('Hello there. How are you? Fine.');
  });

  it('prefers longer phrases over sub-words', () => {
    expect(ruleRewrite('please look into it', 'rewrite')).toBe('Please investigate it.');
  });

  it('keeps a leading capital when replacing', () => {
    expect(ruleRewrite('Hey team', 'rewrite')).toBe('Hello team.');
  });

  it('casual mode loosens formal phrasing without adding a period', () => {
    expect(ruleRewrite('Hello, in order to finish we must utilize the tool', 'casual')).toBe(
      'Hey, to finish we must use the tool',
    );
  });
});
