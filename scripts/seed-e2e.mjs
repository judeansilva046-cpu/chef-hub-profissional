// Seeds the local Supabase project with the fixed e2e user + empresa + product
// that the Playwright suite (e2e/fixtures.ts) expects. Idempotent: safe to run
// multiple times. Requires a running local Supabase stack and the env vars in
// .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
//
//   node scripts/seed-e2e.mjs
//
// This is a local-development helper only; production/hosted Supabase is
// managed via migrations (see docs/DATABASE.md).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

// Must match e2e/fixtures.ts.
const E2E_EMAIL = "e2e-teste@chefhub.local";
const E2E_PASSWORD = "E2eTeste!2026Senha";
const E2E_EMPRESA_ID = "fa43de88-a47d-4758-b137-7ee49fa40394";
const E2E_PRODUTO_NOME = "Produto E2E";
const E2E_ADICIONAL_NOME = "Adicional E2E";

const CANAIS_VENDA_PADRAO = [
  { tipo: "ifood", nome: "iFood" },
  { tipo: "99food", nome: "99Food" },
  { tipo: "keeta", nome: "Keeta" },
  { tipo: "proprio", nome: "Delivery Próprio" },
];

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser() {
  const { data: list, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  const existing = list.users.find((u) => u.email === E2E_EMAIL);
  if (existing) {
    console.log(`user: exists (${existing.id})`);
    return existing.id;
  }
  const { data, error: createErr } = await admin.auth.admin.createUser({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
    email_confirm: true,
    user_metadata: { nome_completo: "Usuário E2E" },
  });
  if (createErr) throw createErr;
  console.log(`user: created (${data.user.id})`);
  return data.user.id;
}

async function ensureEmpresa(userId) {
  const { data: existing } = await admin
    .from("empresas")
    .select("id")
    .eq("id", E2E_EMPRESA_ID)
    .maybeSingle();
  if (existing) {
    console.log("empresa: exists");
    return;
  }
  const { error } = await admin.from("empresas").insert({
    id: E2E_EMPRESA_ID,
    usuario_id: userId,
    nome: "Restaurante E2E",
    tipo_negocio: "restaurante",
    margem_contribuicao_padrao: 70,
  });
  if (error) throw error;
  console.log("empresa: created");
}

async function ensureCanais() {
  for (const canal of CANAIS_VENDA_PADRAO) {
    const { data: existing } = await admin
      .from("canais_venda")
      .select("id")
      .eq("empresa_id", E2E_EMPRESA_ID)
      .eq("tipo", canal.tipo)
      .maybeSingle();
    if (existing) continue;
    const { error } = await admin.from("canais_venda").insert({
      empresa_id: E2E_EMPRESA_ID,
      tipo: canal.tipo,
      nome: canal.nome,
    });
    if (error) throw error;
  }
  console.log("canais_venda: ensured");
}

async function getUnidadeUn() {
  const { data, error } = await admin
    .from("unidades_medida")
    .select("id")
    .is("empresa_id", null)
    .eq("sigla", "un")
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureFicha(nome, { preco, adicional }, unidadeId) {
  const { data: existing } = await admin
    .from("fichas_tecnicas")
    .select("id")
    .eq("empresa_id", E2E_EMPRESA_ID)
    .eq("nome", nome)
    .maybeSingle();
  if (existing) {
    console.log(`ficha "${nome}": exists`);
    return;
  }
  const { error } = await admin.from("fichas_tecnicas").insert({
    empresa_id: E2E_EMPRESA_ID,
    nome,
    rendimento_quantidade: 1,
    rendimento_unidade_id: unidadeId,
    preco_venda_praticado: preco,
    disponivel_como_adicional: Boolean(adicional),
    ativo: true,
  });
  if (error) throw error;
  console.log(`ficha "${nome}": created`);
}

async function main() {
  const userId = await ensureUser();
  await ensureEmpresa(userId);
  await ensureCanais();
  const unidadeId = await getUnidadeUn();
  await ensureFicha(E2E_PRODUTO_NOME, { preco: 25.0 }, unidadeId);
  await ensureFicha(E2E_ADICIONAL_NOME, { preco: 5.0, adicional: true }, unidadeId);
  console.log("seed: done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
