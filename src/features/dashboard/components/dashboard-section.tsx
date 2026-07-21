import type { ReactNode } from "react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export interface DashboardSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function DashboardSection({
  title,
  description,
  children,
}: DashboardSectionProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div>
        <Heading level={3}>{title}</Heading>
        {description ? (
          <Text tone="muted" size="sm" className="mt-1">
            {description}
          </Text>
        ) : null}
      </div>
      {children}
    </section>
  );
}
