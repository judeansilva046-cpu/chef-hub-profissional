import { type HTMLAttributes, createElement } from "react";

import { cn } from "@/lib/utils";

const levelStyles = {
  1: "text-4xl sm:text-5xl",
  2: "text-3xl sm:text-4xl",
  3: "text-2xl sm:text-3xl",
  4: "text-xl sm:text-2xl",
} as const;

type HeadingLevel = keyof typeof levelStyles;

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  as?: "h1" | "h2" | "h3" | "h4";
}

export function Heading({ className, level = 2, as, ...props }: HeadingProps) {
  const tag = as ?? (`h${level}` as const);
  return createElement(tag, {
    className: cn(
      "font-semibold tracking-tight text-foreground",
      levelStyles[level],
      className,
    ),
    ...props,
  });
}
