/**
 * Generate unique share code for tournaments
 * Format: 8 characters, uppercase alphanumeric (bez podobnych: 0/O, 1/I/L)
 */

const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Bez: 0, O, 1, I, L

export function generateShareCode(length: number = 8): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARS.length);
    code += CHARS[randomIndex];
  }
  return code;
}

/**
 * Check if share code is valid format
 */
export function isValidShareCode(code: string): boolean {
  if (code.length !== 8) return false;
  return /^[A-Z2-9]{8}$/.test(code);
}
