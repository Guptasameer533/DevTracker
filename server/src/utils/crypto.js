const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey() {
  const keyBase64 = process.env.ENCRYPTION_KEY;
  if (!keyBase64) throw new Error('ENCRYPTION_KEY is not set');
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
  return key;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64 string: iv || ciphertext || tag (all concatenated).
 */
function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, encrypted, tag]).toString('base64');
}

/**
 * Decrypts a base64 string produced by `encrypt`.
 */
function decrypt(ciphertext) {
  const key = getKey();
  const data = Buffer.from(ciphertext, 'base64');

  const iv = data.subarray(0, IV_BYTES);
  const tag = data.subarray(data.length - TAG_BYTES);
  const encrypted = data.subarray(IV_BYTES, data.length - TAG_BYTES);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = { encrypt, decrypt };
