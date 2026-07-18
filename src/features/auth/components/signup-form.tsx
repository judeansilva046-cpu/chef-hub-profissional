"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

import { signup } from "../actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Comece a organizar fichas técnicas e custos do seu negócio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nomeCompleto">Nome completo</Label>
            <Input
              id="nomeCompleto"
              name="nomeCompleto"
              autoComplete="name"
              required
            />
            {state?.fieldErrors?.nomeCompleto && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.nomeCompleto[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            {state?.fieldErrors?.email && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.email[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            {state?.fieldErrors?.password && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.password[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmarSenha">Confirmar senha</Label>
            <Input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              autoComplete="new-password"
              required
            />
            {state?.fieldErrors?.confirmarSenha && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.confirmarSenha[0]}
              </Text>
            )}
          </div>

          {state?.formError && (
            <Text size="sm" tone="danger">
              {state.formError}
            </Text>
          )}

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Criando conta..." : "Criar conta"}
          </Button>

          <Text size="sm" tone="muted" className="text-center">
            Já tem conta?{" "}
            <Link href="/login" className="text-primary font-medium">
              Entrar
            </Link>
          </Text>
        </form>
      </CardContent>
    </Card>
  );
}
