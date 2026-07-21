import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
  tone?: "default" | "warning" | "danger" | "success";
}

const TONE_CLASS: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "",
  warning: "border-amber-500/40",
  danger: "border-destructive/40",
  success: "border-emerald-500/40",
};

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
  tone = "default",
}: MetricCardProps) {
  return (
    <Card className={cn("min-w-0", TONE_CLASS[tone], className)}>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {label}
        </CardTitle>
        {Icon ? <Icon className="text-muted-foreground h-4 w-4 shrink-0" /> : null}
      </CardHeader>
      <CardContent>
        <Text className="text-2xl font-semibold tracking-tight">{value}</Text>
        {hint ? (
          <Text tone="muted" size="sm" className="mt-1">
            {hint}
          </Text>
        ) : null}
      </CardContent>
    </Card>
  );
}
