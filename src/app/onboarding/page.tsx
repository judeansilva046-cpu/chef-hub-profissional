import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CriarEmpresaForm } from "@/features/empresa/components/criar-empresa-form";
import { verifySession } from "@/server/auth/dal";

export const metadata: Metadata = {
  title: "Criar empresa — Chef Hub Profissional",
};

export default async function OnboardingPage() {
  await verifySession();

  return (
    <div className="bg-secondary/40 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-foreground mb-8 text-center text-lg font-semibold tracking-tight">
          Chef Hub <span className="text-primary">Profissional</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Cadastre sua empresa</CardTitle>
            <CardDescription>
              Cada empresa tem seus próprios ingredientes, fichas técnicas e
              custos. Você pode criar outras empresas depois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CriarEmpresaForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
