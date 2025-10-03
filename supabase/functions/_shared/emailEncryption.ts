/**
 * Email Password Encryption/Decryption
 * 
 * Uses AES-256-GCM encryption for email passwords
 * Requires EMAIL_ENCRYPTION_KEY in Supabase Secrets
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits authentication tag

/**
 * Get encryption key from environment
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get('EMAIL_ENCRYPTION_KEY');
  
  if (!keyString) {
    throw new Error('EMAIL_ENCRYPTION_KEY not set in environment');
  }

  // Convert key string to ArrayBuffer
  const keyData = new TextEncoder().encode(keyString);
  
  // Hash the key to ensure it's exactly 256 bits
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  
  // Import as CryptoKey
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a password
 * 
 * @param password - Plain text password
 * @returns Encrypted password in format: iv:ciphertext:tag (base64)
 */
export async function encryptPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password cannot be empty');
  }

  try {
    const key = await getEncryptionKey();
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Convert password to ArrayBuffer
    const passwordBuffer = new TextEncoder().encode(password);
    
    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH * 8, // in bits
      },
      key,
      passwordBuffer
    );
    
    // Convert to base64 and combine with IV
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
    
    // Format: iv:encrypted
    return `${ivBase64}:${encryptedBase64}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypt a password
 * 
 * @param encrypted - Encrypted password in format: iv:ciphertext:tag (base64)
 * @returns Plain text password
 */
export async function decryptPassword(encrypted: string): Promise<string> {
  if (!encrypted) {
    throw new Error('Encrypted password cannot be empty');
  }

  try {
    const key = await getEncryptionKey();
    
    // Split IV and encrypted data
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted password format');
    }
    
    const [ivBase64, encryptedBase64] = parts;
    
    // Decode from base64
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH * 8,
      },
      key,
      encryptedData
    );
    
    // Convert back to string
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt password - may be corrupted or key changed');
  }
}

/**
 * Test encryption/decryption
 * 
 * @returns true if encryption is working correctly
 */
export async function testEncryption(): Promise<boolean> {
  try {
    const testPassword = 'test-password-123!@#';
    const encrypted = await encryptPassword(testPassword);
    const decrypted = await decryptPassword(encrypted);
    return testPassword === decrypted;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
}

/**
 * Validate that encryption key is properly configured
 */
export async function validateEncryptionKey(): Promise<{
  configured: boolean;
  working: boolean;
  error?: string;
}> {
  try {
    const keyString = Deno.env.get('EMAIL_ENCRYPTION_KEY');
    
    if (!keyString) {
      return {
        configured: false,
        working: false,
        error: 'EMAIL_ENCRYPTION_KEY not set in environment'
      };
    }

    if (keyString.length < 32) {
      return {
        configured: true,
        working: false,
        error: 'EMAIL_ENCRYPTION_KEY too short (minimum 32 characters)'
      };
    }

    // Test if encryption actually works
    const working = await testEncryption();
    
    return {
      configured: true,
      working,
      error: working ? undefined : 'Encryption test failed'
    };
  } catch (error) {
    return {
      configured: true,
      working: false,
      error: error.message
    };
  }
}

