"use client";

import { useEffect } from "react";

/**
 * Registra o service worker do PWA em /sw.js (cache de estáticos +
 * network-first para navegações; /api/ fica de fora).
 */
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Falha silenciosa — PWA é aprimoramento, não requisito.
    });
  }, []);

  return null;
}
