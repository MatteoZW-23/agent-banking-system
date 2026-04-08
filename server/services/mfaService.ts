import crypto from "node:crypto";

/**
 * MFA Service providing TOTP (Time-based One-Time Password) functionality.
 * Implemented using Node.js crypto to avoid external dependencies.
 */
export const mfaService = {
  /**
   * Generates a random base32-style secret (20 characters)
   */
  generateSecret(): string {
    const buffer = crypto.randomBytes(20);
    // Use a custom base32 encoding (A-Z, 2-7)
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < buffer.length; i++) {
      secret += alphabet[buffer[i] % 32];
    }
    return secret;
  },

  /**
   * Generates backup codes
   */
  generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    return codes;
  },

  /**
   * Verifies a TOTP token against a secret
   */
  async verifyToken(secret: string, token: string): Promise<boolean> {
    if (!token || token.length !== 6) return false;

    // Standard TOTP parameters
    const period = 30; // 30 seconds
    const digits = 6;
    const window = 1; // Allow 1 step before/after for clock drift

    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / period);

    // Check current, previous, and next window
    for (let i = -window; i <= window; i++) {
      const generated = this.generateToken(secret, counter + i);
      if (generated === token) return true;
    }

    return false;
  },

  /**
   * Internal helper to generate a token for a given counter
   */
  generateToken(secret: string, counter: number): string {
    // 1. Decode base32 secret to buffer
    const key = this.decodeBase32(secret);

    // 2. Prepare counter as 8-byte buffer (big-endian)
    const counterBuf = Buffer.alloc(8);
    for (let i = 7; i >= 0; i--) {
      counterBuf[i] = counter & 0xff;
      counter = counter >> 8;
    }

    // 3. HMAC-SHA1
    const hmac = crypto.createHmac("sha1", key);
    hmac.update(counterBuf);
    const digest = hmac.digest();

    // 4. Dynamic Truncation
    const offset = digest[digest.length - 1] & 0xf;
    const code =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    // 5. Modulo to get 6 digits
    const token = code % Math.pow(10, 6);
    return token.toString().padStart(6, "0");
  },

  /**
   * Helper to decode a base32 string into a Buffer
   */
  decodeBase32(base32: string): Buffer {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const cleaned = base32.replace(/=+$/, "").toUpperCase();
    const len = cleaned.length;
    const buffer = Buffer.alloc(Math.floor((len * 5) / 8));

    let bits = 0;
    let value = 0;
    let index = 0;

    for (let i = 0; i < len; i++) {
      const charValue = alphabet.indexOf(cleaned[i]);
      if (charValue === -1) continue;

      value = (value << 5) | charValue;
      bits += 5;

      if (bits >= 8) {
        buffer[index++] = (value >> (bits - 8)) & 0xff;
        bits -= 8;
      }
    }

    return buffer;
  },

  /**
   * Generates an otpauth:// URI for QR codes
   */
  getOtpauthUri(secret: string, email: string, issuer = "AgentTrack"): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
  }
};
