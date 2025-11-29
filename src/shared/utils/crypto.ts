const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts data using AES-GCM
 * @param data - Data to encrypt (will be JSON stringified)
 * @param password - Encryption password from env
 * @returns Base64 encoded encrypted data with salt and IV
 */
export const encrypt = async (data: unknown, password: string): Promise<string> => {
  if (!password) {
    throw new Error('Encryption password not provided');
  }

  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const dataBuffer = encoder.encode(dataString);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive key from password
  const key = await deriveKey(password, salt);

  // Encrypt data
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
};

/**
 * Decrypts data using AES-GCM
 * @param encryptedData - Base64 encoded encrypted data
 * @param password - Decryption password from env
 * @returns Decrypted data
 */
export const decrypt = async <T = unknown>(
  encryptedData: string,
  password: string
): Promise<T> => {
  if (!password) {
    throw new Error('Decryption password not provided');
  }

  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedBuffer = combined.slice(28);

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBuffer
    );

    // Convert back to string and parse JSON
    const decoder = new TextDecoder();
    const dataString = decoder.decode(decryptedBuffer);
    return JSON.parse(dataString) as T;
  } catch (error) {
    throw new Error('Failed to decrypt data. Password may be incorrect or data corrupted.');
  }
};

/**
 * Gets the encryption password from environment variables
 */
export const getEncryptionPassword = (): string => {
  const password = import.meta.env.VITE_WALLET_ENCRYPTION_KEY;

  if (!password) {
    throw new Error(
      'VITE_WALLET_ENCRYPTION_KEY not found in environment variables. ' +
      'Please add it to your .env file.'
    );
  }

  if (password === 'your-secret-encryption-key-change-this-in-production') {
    console.warn(
      '⚠️ WARNING: Using default encryption key! ' +
      'Change VITE_WALLET_ENCRYPTION_KEY in .env for production.'
    );
  }

  return password;
};
