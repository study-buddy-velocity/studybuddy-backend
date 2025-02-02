import { createCipheriv, randomBytes, createDecipheriv, createHash  } from 'crypto';




  const alg = 'aes-256-ctr';
  export let encryptkeyString = 'MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQBECoshPnFOL';
  const iv = randomBytes(16);

  let key = createHash('sha256').update(String(encryptkeyString)).digest('base64').substring(0, 32);
  export const encryptData = (data) => {
    const cipher = createCipheriv(alg, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  };


  export const decryptData = (encryptedText) => {
    const [iv, encrypted] = encryptedText.split(':');
    const decipher = createDecipheriv(alg, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };