"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Ação irreversível (cancelamento, exclusão, fechamento) — usa o botão destrutivo. */
  destructive?: boolean;
  /** Quando true, exige um texto (ex: motivo do cancelamento) antes de confirmar. */
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason?: string) => void | Promise<void>;
}

/**
 * Substitui window.confirm/window.prompt para ações críticas — mesmo
 * propósito, mas com espaço para descrição e (opcionalmente) motivo
 * obrigatório, sem bloquear a thread do navegador. Primeiro componente
 * compartilhado desse tipo no projeto (Sprint 05); os 7 usos legados de
 * window.confirm em outras features não são migrados nesta sprint.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  requireReason = false,
  reasonLabel = "Motivo",
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const reasonValida = !requireReason || reason.trim().length >= 3;

  async function confirmar() {
    setErro(null);
    setPending(true);
    try {
      await onConfirm(requireReason ? reason.trim() : undefined);
      setReason("");
      onOpenChange(false);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {requireReason && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-dialog-reason">{reasonLabel}</Label>
            <Textarea
              id="confirm-dialog-reason"
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              autoFocus
            />
          </div>
        )}

        {erro && (
          <Text size="sm" tone="danger">
            {erro}
          </Text>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "primary"}
            disabled={pending || !reasonValida}
            onClick={confirmar}
          >
            {pending ? "Aguarde..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
