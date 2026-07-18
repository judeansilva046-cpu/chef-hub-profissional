import { type ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-secondary/40 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-foreground mb-8 text-center text-lg font-semibold tracking-tight">
          Chef Hub <span className="text-primary">Profissional</span>
        </div>
        {children}
      </div>
    </div>
  );
}
