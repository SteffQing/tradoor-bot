import crypto from "crypto";
import { getEnv } from ".";

const ENCRYPTION_KEY = getEnv("ENCRYPTION_KEY"); // Must be 32 characters for aes-256
console.log("Encryption Key Length:", ENCRYPTION_KEY.length, ENCRYPTION_KEY);
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be 32 characters long");
}
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(enc: string) {
  const [ivHex, encryptedHex] = enc.split(":");

  if (!ivHex || !encryptedHex) throw new Error("Invalid encrypted text format");

  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export { encrypt, decrypt };
