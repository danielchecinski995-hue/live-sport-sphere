import { generateShareCode, isValidShareCode } from '../../utils/generateCode';

describe('generateShareCode', () => {
  it('generates an 8-character code by default', () => {
    const code = generateShareCode();
    expect(code).toHaveLength(8);
  });

  it('generates a code of custom length', () => {
    const code = generateShareCode(12);
    expect(code).toHaveLength(12);
  });

  it('only uses allowed characters (no 0, O, 1, I, L)', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateShareCode();
      expect(code).not.toMatch(/[01OIL]/);
      expect(code).toMatch(/^[A-Z2-9]+$/);
    }
  });

  it('generates unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateShareCode());
    }
    // With 30^8 possibilities, 100 codes should all be unique
    expect(codes.size).toBe(100);
  });
});

describe('isValidShareCode', () => {
  it('accepts valid 8-char codes', () => {
    expect(isValidShareCode('ABCDEFGH')).toBe(true);
    expect(isValidShareCode('23456789')).toBe(true);
    expect(isValidShareCode('AB2CD3EF')).toBe(true);
  });

  it('rejects codes with wrong length', () => {
    expect(isValidShareCode('ABC')).toBe(false);
    expect(isValidShareCode('ABCDEFGHIJK')).toBe(false);
    expect(isValidShareCode('')).toBe(false);
  });

  it('rejects codes with invalid characters', () => {
    expect(isValidShareCode('ABCDEFG0')).toBe(false); // has 0
    expect(isValidShareCode('ABCDEFG1')).toBe(false); // has 1
    expect(isValidShareCode('abcdefgh')).toBe(false); // lowercase
  });
});
