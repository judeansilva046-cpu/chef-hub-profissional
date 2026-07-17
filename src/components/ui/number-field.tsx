"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

export interface NumberFieldProps {
  id?: string;
  /**
   * Quando informado, um <input type="hidden"> espelha o valor numérico cru
   * (não formatado) sob este nome — para submissão nativa via FormData em
   * Server Actions. O <input> visível nunca carrega `name` diretamente, pois
   * seu valor exibido é formatado (ex: "R$ 12,50"), não um número parseável.
   */
  name?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  kind?: "decimal" | "currency" | "percent";
  min?: number;
  max?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const formatters: Record<
  NonNullable<NumberFieldProps["kind"]>,
  Intl.NumberFormat
> = {
  decimal: new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }),
  currency: new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }),
  percent: new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }),
};

function parseLocaleNumber(raw: string): number | null {
  const normalized = raw.replace(/[^\d,.-]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Campo numérico com formatação pt-BR (moeda/percentual/decimal) aplicada no
 * blur, editável como texto puro enquanto focado — sem biblioteca de
 * máscara, só Intl.NumberFormat.
 *
 * Enquanto não focado, o texto exibido é sempre derivado de `value` (nunca
 * guardado em estado próprio) — evita useEffect + setState para
 * sincronização, que causaria uma renderização em cascata extra.
 */
export function NumberField({
  id,
  name,
  value,
  onChange,
  kind = "decimal",
  min,
  max,
  placeholder,
  required,
  disabled,
  className,
}: NumberFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [editingText, setEditingText] = useState<string | null>(null);

  const formattedValue = value === null ? "" : formatters[kind].format(value);
  const displayValue = editingText ?? formattedValue;

  return (
    <>
      <input
        id={inputId}
        inputMode="decimal"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onFocus={() => setEditingText(formattedValue)}
        onChange={(event) => setEditingText(event.target.value)}
        onBlur={() => {
          const parsed = parseLocaleNumber(editingText ?? "");
          const clamped =
            parsed === null
              ? null
              : Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed));
          onChange(clamped);
          setEditingText(null);
        }}
        className={cn(
          "border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-right text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      />
      {name && <input type="hidden" name={name} value={value ?? ""} />}
    </>
  );
}

export function CurrencyInput(props: Omit<NumberFieldProps, "kind">) {
  return <NumberField {...props} kind="currency" />;
}

export function PercentInput(props: Omit<NumberFieldProps, "kind">) {
  return <NumberField {...props} kind="percent" />;
}
