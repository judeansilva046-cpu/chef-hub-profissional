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

import { login } from "../actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Acesse a gestão do seu negócio no Chef Hub Profissional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
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
              autoComplete="current-password"
              required
            />
            {state?.fieldErrors?.password && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.password[0]}
              </Text>
            )}
          </div>

          {state?.formError && (
            <Text size="sm" tone="danger">
              {state.formError}
            </Text>
          )}

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Entrando..." : "Entrar"}
          </Button>

          <Text size="sm" tone="muted" className="text-center">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="text-primary font-medium">
              Criar conta
            </Link>
          </Text>
        </form>
      </CardContent>
    </Card>
  );
}
