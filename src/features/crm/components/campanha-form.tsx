"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";

import { criarCampanha, dispararCampanha } from "../actions";
import type { MarketingCampaign } from "../queries";

export function CampanhaForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      try {
        await criarCampanha({
          name: formData.get("name"),
          channel: formData.get("channel"),
          segmentKey: formData.get("segmentKey") || null,
          templateBody: formData.get("templateBody"),
          automationType: formData.get("automationType") || "manual",
          scheduledAt: formData.get("scheduledAt") || null,
        });
        setMsg("Campanha criada.");
        router.refresh();
      } catch (error) {
        setMsg(error instanceof Error ? error.message : "Falha ao criar.");
      }
    });
  }

  return (
    <form action={onSubmit} className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
      <Text weight="semibold">Nova campanha</Text>
      <input name="name" required placeholder="Nome" className="border-border rounded-md border px-3 py-2 text-sm" />
      <Select name="channel" defaultValue="whatsapp">
        <option value="whatsapp">WhatsApp</option>
        <option value="email">E-mail</option>
        <option value="sms">SMS</option>
        <option value="push">Push</option>
      </Select>
      <Select name="segmentKey" defaultValue="inativos">
        <option value="">Todos (união)</option>
        <option value="vip">VIP</option>
        <option value="novos">Novos</option>
        <option value="inativos">Inativos</option>
        <option value="alto_ticket">Alto ticket</option>
        <option value="baixo_ticket">Baixo ticket</option>
        <option value="frequentes">Frequentes</option>
        <option value="pouco_frequentes">Pouco frequentes</option>
      </Select>
      <Select name="automationType" defaultValue="manual">
        <option value="manual">Manual</option>
        <option value="boas_vindas">Boas-vindas</option>
        <option value="pos_compra">Pós-compra</option>
        <option value="inativos">Inativos</option>
        <option value="aniversario">Aniversário</option>
        <option value="pontos_expirando">Pontos expirando</option>
      </Select>
      <textarea
        name="templateBody"
        required
        rows={4}
        placeholder="Olá {{nome}}, temos uma oferta especial para você!"
        className="border-border rounded-md border px-3 py-2 text-sm"
      />
      <input name="scheduledAt" type="datetime-local" className="border-border rounded-md border px-3 py-2 text-sm" />
      {msg && <Text size="sm" tone="muted">{msg}</Text>}
      <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Criar campanha"}</Button>
    </form>
  );
}

export function CampanhasLista({ campanhas }: { campanhas: MarketingCampaign[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function disparar(id: string) {
    setMsg(null);
    startTransition(async () => {
      try {
        const r = await dispararCampanha(id);
        setMsg(`Enviados ${r.enviados} · falhas ${r.falhas} · ignorados ${r.ignorados}`);
        router.refresh();
      } catch (error) {
        setMsg(error instanceof Error ? error.message : "Falha no disparo.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {msg && <Text size="sm" tone="muted">{msg}</Text>}
      {campanhas.length === 0 ? (
        <Text size="sm" tone="muted">Nenhuma campanha.</Text>
      ) : (
        campanhas.map((c) => (
          <div key={c.id} className="border-border bg-card flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Text weight="medium">{c.name}</Text>
              <Text size="sm" tone="muted">{c.channel} · {c.status}</Text>
            </div>
            <Text size="sm" tone="muted">{c.template_body.slice(0, 120)}</Text>
            <Button size="sm" disabled={pending || c.status === "enviando"} onClick={() => disparar(c.id)}>
              Disparar agora
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
