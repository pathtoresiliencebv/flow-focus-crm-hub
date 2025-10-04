import CryptoJS from 'crypto-js';
import { Preferences } from '@capacitor/preferences';

interface EncryptionConfig {
  keyDerivationRounds: number;
  algorithm: string;
}

class EncryptionService {
  private config: EncryptionConfig = {
    keyDerivationRounds: 10000,
    algorithm: 'AES'
  };

  private masterKey: string | null = null;

  /**
   * Initialize or retrieve master key for encryption
   */
  async initializeMasterKey(passphrase?: string): Promise<void> {
    try {
      // Check if master key exists
      const { value: existingKey } = await Preferences.get({ key: 'encryption_master_key' });
      
      if (existingKey) {
        this.masterKey = existingKey;
        return;
      }

      // Generate or retrieve salt
      let salt = '';
      const { value: existingSalt } = await Preferences.get({ key: 'encryption_salt' });
      
      if (existingSalt) {
        salt = existingSalt;
      } else {
        salt = this.generateSalt();
        await Preferences.set({ key: 'encryption_salt', value: salt });
      }

      // Generate new master key
      const key = passphrase 
        ? CryptoJS.PBKDF2(passphrase, salt, { 
            keySize: 256/32, 
            iterations: this.config.keyDerivationRounds 
          }).toString()
        : CryptoJS.lib.WordArray.random(256/8).toString();

      await Preferences.set({ 
        key: 'encryption_master_key', 
        value: key 
      });
      
      this.masterKey = key;
    } catch (error) {
      console.error('Failed to initialize master key:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string, customKey?: string): string {
    try {
      const key = customKey || this.masterKey;
      if (!key) {
        throw new Error('Encryption key not available');
      }

      const encrypted = CryptoJS.AES.encrypt(data, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string, customKey?: string): string {
    try {
      const key = customKey || this.masterKey;
      if (!key) {
        throw new Error('Decryption key not available');
      }

      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt object data
   */
  encryptObject<T>(obj: T, customKey?: string): string {
    return this.encrypt(JSON.stringify(obj), customKey);
  }

  /**
   * Decrypt object data
   */
  decryptObject<T>(encryptedData: string, customKey?: string): T {
    const decrypted = this.decrypt(encryptedData, customKey);
    return JSON.parse(decrypted);
  }

  /**
   * Generate hash for data integrity
   */
  generateHash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Verify data integrity
   */
  verifyHash(data: string, hash: string): boolean {
    return this.generateHash(data) === hash;
  }

  /**
   * Secure key derivation
   */
  deriveKey(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: this.config.keyDerivationRounds
    }).toString();
  }

  /**
   * Generate secure random salt
   */
  generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128/8).toString();
  }

  /**
   * Mask sensitive data for display
   */
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }
    
    const visible = data.slice(-visibleChars);
    const masked = '*'.repeat(data.length - visibleChars);
    return masked + visible;
  }

  /**
   * Clear master key from memory
   */
  clearKeys(): void {
    this.masterKey = null;
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(newPassphrase?: string): Promise<void> {
    try {
      // Remove old key and salt
      await Preferences.remove({ key: 'encryption_master_key' });
      await Preferences.remove({ key: 'encryption_salt' });
      
      // Clear in-memory key
      this.masterKey = null;
      
      // Initialize new key with new salt
      await this.initializeMasterKey(newPassphrase);
      
      // Log key rotation for audit purposes
      console.log('Encryption key rotated successfully at:', new Date().toISOString());
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw new Error('Failed to rotate encryption key');
    }
  }

  /**
   * Backup encryption configuration
   */
  async backupEncryptionConfig(): Promise<string> {
    try {
      const { value: key } = await Preferences.get({ key: 'encryption_master_key' });
      const { value: salt } = await Preferences.get({ key: 'encryption_salt' });
      
      if (!key || !salt) {
        throw new Error('No encryption configuration to backup');
      }
      
      return JSON.stringify({
        encryptedKey: this.encrypt(key, 'backup-key'),
        salt: salt,
        timestamp: Date.now(),
        config: this.config
      });
    } catch (error) {
      console.error('Backup failed:', error);
      throw new Error('Failed to backup encryption configuration');
    }
  }

  /**
   * Restore encryption configuration from backup
   */
  async restoreEncryptionConfig(backupData: string, backupPassword: string): Promise<void> {
    try {
      const backup = JSON.parse(backupData);
      const restoredKey = this.decrypt(backup.encryptedKey, 'backup-key');
      
      await Preferences.set({ key: 'encryption_master_key', value: restoredKey });
      await Preferences.set({ key: 'encryption_salt', value: backup.salt });
      
      this.masterKey = restoredKey;
      this.config = backup.config || this.config;
      
      console.log('Encryption configuration restored successfully at:', new Date().toISOString());
    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error('Failed to restore encryption configuration');
    }
  }
}

export const encryptionService = new EncryptionService();