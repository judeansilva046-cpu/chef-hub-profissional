"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export interface SearchInputProps {
  /** Nome do search param na URL (ex: "busca"). */
  paramName?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Campo de busca client-side que sincroniza com a URL (?busca=...), para que
 * a listagem (Server Component) reaja via searchParams. Sempre volta para a
 * página 1 quando o termo muda.
 */
export function SearchInput({
  paramName = "busca",
  placeholder = "Buscar...",
  className,
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(searchParams.get(paramName) ?? "");
  const debounced = useDebouncedValue(value, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (debounced) {
      params.set(paramName, debounced);
    } else {
      params.delete(paramName);
    }
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, paramName, pathname]);

  return (
    <div className={cn("relative", className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background flex h-10 w-full rounded-md border py-2 pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      />
    </div>
  );
}
