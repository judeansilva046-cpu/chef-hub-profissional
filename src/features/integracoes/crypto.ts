import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM na camada de aplicação — não dentro do Postgres (ver
 * comentário em supabase/migrations/0029_integracoes.sql). A chave vem de
 * INTEGRACOES_SECRET_KEY (32 bytes, base64), nunca do banco. Formato
 * gravado em credenciais_criptografadas: base64(iv) + "." + base64(authTag)
 * + "." + base64(ciphertext).
 */
function obterChave(): Buffer {
  const chaveBase64 = process.env.INTEGRACOES_SECRET_KEY;
  if (!chaveBase64) {
    throw new Error(
      "INTEGRACOES_SECRET_KEY não configurada — necessária para conectar uma integração.",
    );
  }
  const chave = Buffer.from(chaveBase64, "base64");
  if (chave.length !== 32) {
    throw new Error("INTEGRACOES_SECRET_KEY deve ter 32 bytes (256 bits) em base64.");
  }
  return chave;
}

export function criptografarCredenciais(credenciais: Record<string, string>): string {
  const chave = obterChave();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chave, iv);

  const texto = JSON.stringify(credenciais);
  const ciphertext = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(
    ".",
  );
}

export function descriptografarCredenciais(
  valorCriptografado: string,
): Record<string, string> {
  const chave = obterChave();
  const [ivBase64, authTagBase64, ciphertextBase64] = valorCriptografado.split(".");
  if (!ivBase64 || !authTagBase64 || !ciphertextBase64) {
    throw new Error("Credenciais criptografadas em formato inválido.");
  }

  const decipher = createDecipheriv("aes-256-gcm", chave, Buffer.from(ivBase64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  const texto = Buffer.concat([
    decipher.update(Buffer.from(ciphertextBase64, "base64")),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(texto) as Record<string, string>;
}
