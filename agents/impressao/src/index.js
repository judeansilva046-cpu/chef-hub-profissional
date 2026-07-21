#!/usr/bin/env node

/**
 * Agente local de impressão — polling da fila do Chef Hub.
 *
 * Variáveis de ambiente:
 *   CHEF_HUB_BASE_URL  — ex: https://app.exemplo.com (sem barra final)
 *   CHEF_HUB_API_KEY   — chave Bearer gerada em Etiquetas → Novo agente
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const POLL_MS = 5_000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTBOX_DIR = join(__dirname, "..", "outbox");

const baseUrl = (process.env.CHEF_HUB_BASE_URL || "").replace(/\/$/, "");
const apiKey = process.env.CHEF_HUB_API_KEY || "";

if (!baseUrl || !apiKey) {
  console.error(
    "Configure CHEF_HUB_BASE_URL e CHEF_HUB_API_KEY antes de iniciar o agente.",
  );
  process.exit(1);
}

let rodando = true;
let timer = null;

process.on("SIGINT", () => {
  console.log("\nEncerrando agente...");
  rodando = false;
  if (timer) clearTimeout(timer);
  process.exit(0);
});

process.on("SIGTERM", () => {
  rodando = false;
  if (timer) clearTimeout(timer);
  process.exit(0);
});

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const texto = await response.text();
  let json = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    const msg = json?.erro || texto || response.statusText;
    throw new Error(`${response.status}: ${msg}`);
  }
  return json;
}

async function marcarStatus(id, status, erroMensagem) {
  const body = { status };
  if (erroMensagem) body.erroMensagem = erroMensagem;
  await api(`/api/agente-impressao/trabalhos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

async function processarTrabalho(trabalho) {
  const destino = join(OUTBOX_DIR, `${trabalho.id}.json`);
  await writeFile(destino, JSON.stringify(trabalho, null, 2), "utf8");
  console.log(
    `[${trabalho.tipo}] ${trabalho.id} → ${destino}`,
  );
  if (trabalho.payload) {
    console.log(JSON.stringify(trabalho.payload));
  }
  await marcarStatus(trabalho.id, "concluido");
}

async function ciclo() {
  try {
    // GET já claima os trabalhos como processando no servidor.
    const data = await api("/api/agente-impressao/trabalhos");
    const trabalhos = data?.trabalhos ?? [];
    if (trabalhos.length === 0) {
      process.stdout.write(".");
      return;
    }
    console.log(`\n${trabalhos.length} trabalho(s) recebido(s).`);
    for (const trabalho of trabalhos) {
      try {
        await processarTrabalho(trabalho);
      } catch (error) {
        const mensagem = error instanceof Error ? error.message : String(error);
        console.error(`Erro no trabalho ${trabalho.id}:`, mensagem);
        try {
          await marcarStatus(trabalho.id, "erro", mensagem);
        } catch (patchError) {
          console.error("Falha ao reportar erro:", patchError);
        }
      }
    }
  } catch (error) {
    console.error("\nFalha no polling:", error instanceof Error ? error.message : error);
  }
}

async function main() {
  await mkdir(OUTBOX_DIR, { recursive: true });
  console.log(`Agente Chef Hub iniciado.`);
  console.log(`Base: ${baseUrl}`);
  console.log(`Outbox: ${OUTBOX_DIR}`);
  console.log(`Polling a cada ${POLL_MS / 1000}s (Ctrl+C para sair).\n`);

  while (rodando) {
    await ciclo();
    if (!rodando) break;
    await new Promise((resolve) => {
      timer = setTimeout(resolve, POLL_MS);
    });
  }
}

main();
