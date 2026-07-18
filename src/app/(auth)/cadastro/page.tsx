import type { Metadata } from "next";

import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Criar conta — Chef Hub Profissional",
};

export default function CadastroPage() {
  return <SignupForm />;
}
