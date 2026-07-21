import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface QuickActionProps {
  href: string;
  label: string;
  icon?: LucideIcon;
  variant?: "primary" | "outline" | "ghost" | "secondary";
}

export function QuickAction({
  href,
  label,
  icon: Icon,
  variant = "outline",
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size: "sm" }))}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {label}
    </Link>
  );
}
