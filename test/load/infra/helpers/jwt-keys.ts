import { generateKeyPairSync } from 'node:crypto';

export function generateJwtKeys() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return {
    privateKeyBase64: Buffer.from(privateKey).toString('base64'),
    publicKeyBase64: Buffer.from(publicKey).toString('base64'),
  };
}
