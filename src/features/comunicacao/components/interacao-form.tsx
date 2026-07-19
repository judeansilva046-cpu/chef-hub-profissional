"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { registrarInteracao } from "../actions";

export function InteracaoForm({ clienteId }: { clienteId: string }) {
  const [pending, startTransition] = useTransition();
  const [canal, setCanal] = useState("whatsapp");
  const [tipo, setTipo] = useState("mensagem");
  const assuntoRef = useRef<HTMLInputElement>(null);
  const conteudoRef = useRef<HTMLTextAreaElement>(null);

  function registrar() {
    const conteudo = conteudoRef.current?.value.trim();
    if (!conteudo) return;
    startTransition(async () => {
      try {
        await registrarInteracao({
          clienteId,
          canal,
          tipo,
          assunto: assuntoRef.current?.value || undefined,
          conteudo,
        });
        if (assuntoRef.current) assuntoRef.current.value = "";
        if (conteudoRef.current) conteudoRef.current.value = "";
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível registrar.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Select value={canal} onChange={(e) => setCanal(e.target.value)}>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">E-mail</option>
          <option value="sms">SMS</option>
          <option value="ligacao">Ligação</option>
          <option value="presencial">Presencial</option>
          <option value="interno">Nota interna</option>
        </Select>
        <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="mensagem">Mensagem</option>
          <option value="nota">Nota</option>
          <option value="reclamacao">Reclamação</option>
        </Select>
      </div>
      <Input ref={assuntoRef} placeholder="Assunto (opcional)" />
      <Textarea ref={conteudoRef} rows={2} placeholder="Conteúdo" />
      <div>
        <Button size="sm" disabled={pending} onClick={registrar}>
          {pending ? "Registrando..." : "Registrar interação"}
        </Button>
      </div>
    </div>
  );
}
