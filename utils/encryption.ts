import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

// Function to derive an encryption key from the user ID
async function deriveKey(userId: string): Promise<string> {
  const salt = 'AI-Journal-Salt-' + userId;
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    userId + salt
  );
}

// Encrypt messages
export async function encryptMessages(messages: Array<{ text: string; isUser: boolean; timestamp: string }>, userId: string): Promise<string> {
  try {
    const key = await deriveKey(userId);
    const messageString = JSON.stringify(messages);
    
    // Create a unique nonce for this encryption
    const nonce = Array.from(await Crypto.getRandomBytesAsync(16))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Combine message with key and nonce
    const dataToEncrypt = messageString + nonce;
    
    // Create encrypted hash
    const encrypted = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      dataToEncrypt + key
    );
    
    // Create final encrypted package
    const encryptedPackage = {
      nonce,
      data: messageString,
      hash: encrypted
    };
    
    return Buffer.from(JSON.stringify(encryptedPackage)).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt messages');
  }
}

// Decrypt messages
export async function decryptMessages(encryptedData: string, userId: string): Promise<Array<{ text: string; isUser: boolean; timestamp: string }>> {
  try {
    const key = await deriveKey(userId);
    
    // Parse the encrypted package
    const { nonce, data, hash } = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
    
    // Verify data integrity
    const verifyHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data + nonce + key
    );
    
    if (verifyHash !== hash) {
      throw new Error('Data integrity check failed');
    }
    
    // Parse and return the messages
    return JSON.parse(data);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt messages');
  }
} 