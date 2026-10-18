/**
 * Indic Unicode Grapheme Normalization & Kanglish Cleaning Engine
 * 
 * Normalizes user queries in Kannada, English, and mixed Kanglish scripts:
 * 1. NFC (Canonical Composition) Unicode normalization for Indic grapheme clusters
 * 2. Transliteration of Kannada numerals (೦-೯) to standard ASCII digits (0-9) for consistent RD / RC / RR matching
 * 3. Elimination of invisible zero-width spaces (\u200B, \uFEFF) and non-printing control characters
 * 4. Whitespace and punctuation normalization
 */

// Mapping of Kannada numerals (U+0CE6 to U+0CEF) to ASCII digits (0-9)
const KANNADA_DIGIT_MAP: Record<string, string> = {
  '\u0CE6': '0', // ೦
  '\u0CE7': '1', // ೧
  '\u0CE8': '2', // ೨
  '\u0CE9': '3', // ೩
  '\u0CEA': '4', // ೪
  '\u0CEB': '5', // ೫
  '\u0CEC': '6', // ೬
  '\u0CED': '7', // ೭
  '\u0CEE': '8', // ೮
  '\u0CEF': '9', // ೯
};

const KANNADA_DIGIT_REGEX = /[\u0CE6-\u0CEF]/g;
const ZERO_WIDTH_CHARS_REGEX = /[\u200B\u200E\u200F\uFEFF]/g;
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/**
 * Normalizes Kannada numerals in any string to standard ASCII digits
 * Example: 'RD೦೦೧' -> 'RD001'
 */
export function normalizeKannadaDigits(text: string): string {
  if (!text) return '';
  return text.replace(KANNADA_DIGIT_REGEX, (ch) => KANNADA_DIGIT_MAP[ch] || ch);
}

/**
 * Full Indic text normalization pipeline
 */
export function normalizeIndicText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // 1. NFC Unicode canonical composition (joins decomposed vowel marks with consonants)
  let result = input.normalize('NFC');

  // 2. Strip invisible zero-width & non-printing control characters
  result = result.replace(ZERO_WIDTH_CHARS_REGEX, '');
  result = result.replace(CONTROL_CHARS_REGEX, '');

  // 3. Convert Kannada numerals to ASCII digits
  result = normalizeKannadaDigits(result);

  // 4. Collapse multiple spaces / tabs / newlines to single space and trim
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

export interface IndicNormalizationResult {
  original: string;
  normalized: string;
  containsKannadaScript: boolean;
  containsKannadaDigits: boolean;
  lengthBefore: number;
  lengthAfter: number;
}

export function inspectIndicText(input: string): IndicNormalizationResult {
  const normalized = normalizeIndicText(input);
  const containsKannadaScript = /[\u0C80-\u0CFF]/.test(input);
  const containsKannadaDigits = /[\u0CE6-\u0CEF]/.test(input);

  return {
    original: input,
    normalized,
    containsKannadaScript,
    containsKannadaDigits,
    lengthBefore: input.length,
    lengthAfter: normalized.length,
  };
}
