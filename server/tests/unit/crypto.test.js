const { encrypt, decrypt } = require('../../src/utils/crypto');

// 32-byte key in base64 for testing
const TEST_KEY = Buffer.alloc(32, 'a').toString('base64');

describe('crypto utils', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  it('encrypts and decrypts a string round-trip', () => {
    const plaintext = 'gho_mysecrettoken12345';
    const ciphertext = encrypt(plaintext);
    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertext each call (random IV)', () => {
    const plaintext = 'same_input';
    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);
    expect(c1).not.toBe(c2);
  });

  it('throws when ciphertext is tampered with', () => {
    const plaintext = 'test_token';
    const ciphertext = encrypt(plaintext);
    // Flip a byte in the middle of the ciphertext
    const buf = Buffer.from(ciphertext, 'base64');
    buf[buf.length - 5] ^= 0xff;
    const tampered = buf.toString('base64');
    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws when ENCRYPTION_KEY is wrong length', () => {
    process.env.ENCRYPTION_KEY = 'tooshort';
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must decode to exactly 32 bytes');
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  it('handles unicode strings', () => {
    const unicode = '日本語テスト 🚀';
    expect(decrypt(encrypt(unicode))).toBe(unicode);
  });
});
