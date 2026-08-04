import * as crypto from 'crypto';

const encrypt = (encryptData: string) => {
  if (!encryptData) {
    throw 'ERROR: There is no input data to encrypt.';
  }
  const encryptionKey = crypto
    .createHash('sha256')
    .update(`${process.env.ENCRYPTION_KEY}`)
    .digest();

  const encryptionIvStr = `${process.env.ENCRYPTION_IVKEY}`;
  const encryptionIv = Buffer.from(encryptionIvStr, 'base64');

  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, encryptionIv);
  let encrypted = cipher.update(encryptData, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return {
    data: encrypted,
  };
};

export default encrypt;
