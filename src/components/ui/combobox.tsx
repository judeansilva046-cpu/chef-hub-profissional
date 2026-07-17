"use client";

import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  /** Quando informado, espelha o valor selecionado num <input type="hidden"> para submissão via FormData. */
  name?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  name,
  placeholder = "Selecionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "border-input bg-background text-foreground focus-visible:ring-ring focus-visible:ring-offset-background flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span
            className={cn("truncate", !selected && "text-muted-foreground")}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="border-border bg-card text-card-foreground z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border shadow-lg"
        >
          <CommandPrimitive className="flex flex-col">
            <CommandPrimitive.Input
              placeholder={searchPlaceholder}
              className="border-border text-foreground placeholder:text-muted-foreground h-10 w-full border-b bg-transparent px-3 text-sm focus:outline-none"
            />
            <CommandPrimitive.List className="max-h-64 overflow-y-auto p-1">
              <CommandPrimitive.Empty className="text-muted-foreground px-3 py-6 text-center text-sm">
                {emptyMessage}
              </CommandPrimitive.Empty>
              {options.map((option) => (
                <CommandPrimitive.Item
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className="text-foreground data-[selected=true]:bg-secondary flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      option.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.description && (
                      <span className="text-muted-foreground truncate text-xs">
                        {option.description}
                      </span>
                    )}
                  </span>
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
    </PopoverPrimitive.Root>
  );
}
