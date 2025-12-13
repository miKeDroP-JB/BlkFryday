/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   CRYPTO UTILS - Encryption & Hashing Utilities                           ║
 * ║   Mystical protection for sensitive data                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Simple XOR-based encryption (for demonstration - use proper crypto in production)
const DEFAULT_KEY = 'orb-sigil-key-2024';

/**
 * Encrypt output data
 */
export function encryptOutput(data, key = DEFAULT_KEY) {
    if (typeof data !== 'string') {
        data = JSON.stringify(data);
    }

    const encrypted = xorEncrypt(data, key);

    return {
        encrypted: true,
        data: btoa(encrypted),
        timestamp: Date.now(),
        checksum: simpleHash(data)
    };
}

/**
 * Decrypt input data
 */
export function decryptInput(encryptedData, key = DEFAULT_KEY) {
    if (!encryptedData || !encryptedData.encrypted) {
        return encryptedData;
    }

    try {
        const decoded = atob(encryptedData.data);
        const decrypted = xorEncrypt(decoded, key); // XOR is symmetric

        // Verify checksum
        if (encryptedData.checksum && simpleHash(decrypted) !== encryptedData.checksum) {
            throw new Error('Checksum mismatch - data may be corrupted');
        }

        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    } catch (err) {
        console.error('Decryption failed:', err.message);
        return null;
    }
}

/**
 * XOR encryption (symmetric)
 */
function xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
            text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }
    return result;
}

/**
 * Simple hash function
 */
export function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'id') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate secure token
 */
export function generateToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

/**
 * Hash password (simple - use bcrypt in production)
 */
export function hashPassword(password, salt = '') {
    const salted = password + salt + DEFAULT_KEY;
    let hash = simpleHash(salted);

    // Multiple rounds
    for (let i = 0; i < 1000; i++) {
        hash = simpleHash(hash + salted);
    }

    return hash;
}

/**
 * Verify password
 */
export function verifyPassword(password, hash, salt = '') {
    return hashPassword(password, salt) === hash;
}

/**
 * Base64 encode
 */
export function encode(data) {
    if (typeof data !== 'string') {
        data = JSON.stringify(data);
    }
    return btoa(encodeURIComponent(data));
}

/**
 * Base64 decode
 */
export function decode(encoded) {
    try {
        const decoded = decodeURIComponent(atob(encoded));
        try {
            return JSON.parse(decoded);
        } catch {
            return decoded;
        }
    } catch {
        return null;
    }
}

/**
 * Sign data with key
 */
export function signData(data, key = DEFAULT_KEY) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const signature = simpleHash(payload + key);

    return {
        payload,
        signature,
        signed: Date.now()
    };
}

/**
 * Verify signed data
 */
export function verifySignature(signedData, key = DEFAULT_KEY) {
    if (!signedData || !signedData.payload || !signedData.signature) {
        return false;
    }

    const expectedSignature = simpleHash(signedData.payload + key);
    return signedData.signature === expectedSignature;
}

/**
 * Obfuscate sensitive data for logging
 */
export function obfuscate(data, visibleChars = 4) {
    if (typeof data !== 'string') {
        data = String(data);
    }

    if (data.length <= visibleChars * 2) {
        return '*'.repeat(data.length);
    }

    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(Math.min(data.length - visibleChars * 2, 10));

    return start + middle + end;
}

// Browser/Node compatibility for btoa/atob
const btoa = typeof window !== 'undefined' ? window.btoa : (str) => Buffer.from(str, 'binary').toString('base64');
const atob = typeof window !== 'undefined' ? window.atob : (str) => Buffer.from(str, 'base64').toString('binary');

export default {
    encryptOutput,
    decryptInput,
    simpleHash,
    generateId,
    generateToken,
    hashPassword,
    verifyPassword,
    encode,
    decode,
    signData,
    verifySignature,
    obfuscate
};
