"use client";

import { useEffect, useRef } from "react";

/** Beep curto via Web Audio API (sem asset externo). */
export function tocarAlertaKds(tipo: "novo" | "atraso" = "novo") {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = tipo === "atraso" ? 440 : 880;
    gain.gain.value = 0.08;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (tipo === "atraso" ? 0.45 : 0.2));
    osc.stop(ctx.currentTime + (tipo === "atraso" ? 0.5 : 0.25));
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    // Silencia falhas de autoplay / AudioContext.
  }
}

/**
 * Dispara alerta sonoro quando entram pedidos novos na fila
 * ou quando algum pedido fica atrasado (edge rising).
 */
export function useKdsSoundAlerts(opts: {
  habilitado: boolean;
  idsNovos: string[];
  idsAtrasados: string[];
}) {
  const vistosNovos = useRef<Set<string>>(new Set());
  const vistosAtraso = useRef<Set<string>>(new Set());
  const pronto = useRef(false);
  const chaveNovos = opts.idsNovos.slice().sort().join(",");
  const chaveAtraso = opts.idsAtrasados.slice().sort().join(",");

  useEffect(() => {
    if (!opts.habilitado) return;

    const idsNovos = chaveNovos ? chaveNovos.split(",") : [];
    const idsAtrasados = chaveAtraso ? chaveAtraso.split(",") : [];

    // Ignora o primeiro render para não bipar o histórico já na tela.
    if (!pronto.current) {
      vistosNovos.current = new Set(idsNovos);
      vistosAtraso.current = new Set(idsAtrasados);
      pronto.current = true;
      return;
    }

    const chegouNovo = idsNovos.some((id) => !vistosNovos.current.has(id));
    if (chegouNovo) tocarAlertaKds("novo");
    vistosNovos.current = new Set(idsNovos);

    const novoAtraso = idsAtrasados.some((id) => !vistosAtraso.current.has(id));
    if (novoAtraso) tocarAlertaKds("atraso");
    vistosAtraso.current = new Set(idsAtrasados);
  }, [opts.habilitado, chaveNovos, chaveAtraso]);
}
