import { z } from "zod";

export const perfilClienteSchema = z.object({
  clienteId: z.string().uuid(),
  birthDate: z.string().optional().nullable(),
  originChannel: z.string().trim().max(80).optional().nullable(),
  dietaryPreferences: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  consentWhatsapp: z.boolean().optional(),
  consentEmail: z.boolean().optional(),
  consentSms: z.boolean().optional(),
  consentPush: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const loyaltyProgramSchema = z.object({
  name: z.string().trim().min(1).max(120),
  pointsPerCurrency: z.coerce.number().min(0).max(1000),
  currencyPerPoint: z.coerce.number().min(0).max(100),
  cashbackPercent: z.coerce.number().min(0).max(100),
  pointsValidityDays: z.coerce.number().int().min(1).max(3650),
  minRedeemPoints: z.coerce.number().min(0),
  welcomePoints: z.coerce.number().min(0),
  active: z.boolean().optional(),
});

export const pontosSchema = z.object({
  clienteId: z.string().uuid(),
  points: z.coerce.number().positive(),
  notes: z.string().max(500).optional().nullable(),
});

export const cupomSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  tipo: z.enum([
    "percentual",
    "valor_fixo",
    "frete_gratis",
    "brinde",
    "combo",
    "primeira_compra",
    "aniversario",
    "inatividade",
  ]),
  discountPercent: z.coerce.number().min(0).max(100).optional().nullable(),
  discountAmount: z.coerce.number().min(0).optional().nullable(),
  giftDescription: z.string().max(200).optional().nullable(),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  maxUsesPerCustomer: z.coerce.number().int().positive().default(1),
  startsAt: z.string().optional(),
  endsAt: z.string().optional().nullable(),
  segmentKey: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export const resgatarCupomSchema = z.object({
  code: z.string().trim().min(1),
  clienteId: z.string().uuid().optional().nullable(),
  orderAmount: z.coerce.number().min(0),
  pedidoId: z.string().uuid().optional().nullable(),
});

export const campanhaSchema = z.object({
  name: z.string().trim().min(1).max(120),
  channel: z.enum(["whatsapp", "email", "sms", "push"]),
  segmentKey: z.string().optional().nullable(),
  templateBody: z.string().trim().min(1).max(2000),
  templateName: z.string().max(120).optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  automationType: z
    .enum(["boas_vindas", "pos_compra", "inativos", "aniversario", "pontos_expirando", "manual"])
    .optional()
    .nullable(),
});
