import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";

export interface DashboardLayoutProps {
  title: string;
  description?: string;
  toolbar?: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({
  title,
  description,
  toolbar,
  children,
}: DashboardLayoutProps) {
  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Heading level={2}>{title}</Heading>
            {description ? (
              <Text tone="muted" className="mt-1 max-w-2xl">
                {description}
              </Text>
            ) : null}
          </div>
          {toolbar}
        </div>
        {children}
      </Container>
    </Section>
  );
}
