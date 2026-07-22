import { afterEach, describe, expect, it } from "vitest";

import {
  criptografarCredenciais,
  descriptografarCredenciais,
} from "./crypto-core";

describe("criptografia de credenciais", () => {
  const original = process.env.INTEGRACOES_SECRET_KEY;

  afterEach(() => {
    if (original === undefined) delete process.env.INTEGRACOES_SECRET_KEY;
    else process.env.INTEGRACOES_SECRET_KEY = original;
  });

  it("criptografa e descriptografa com AAD (nunca texto puro)", () => {
    process.env.INTEGRACOES_SECRET_KEY = Buffer.alloc(32, 7).toString("base64");
    const plain = { clientId: "abc", clientSecret: "super-secret" };
    const aad = "empresa-1:ifood";
    const cipher = criptografarCredenciais(plain, aad);

    expect(cipher.includes("super-secret")).toBe(false);
    expect(cipher.split(".")).toHaveLength(3);

    const back = descriptografarCredenciais(cipher, aad);
    expect(back).toEqual(plain);
  });

  it("falha com AAD diferente (isolamento por empresa/provedor)", () => {
    process.env.INTEGRACOES_SECRET_KEY = Buffer.alloc(32, 9).toString("base64");
    const cipher = criptografarCredenciais(
      { token: "x" },
      "empresa-a:ifood",
    );
    expect(() =>
      descriptografarCredenciais(cipher, "empresa-b:ifood"),
    ).toThrow();
  });

  it("exige chave de 32 bytes", () => {
    process.env.INTEGRACOES_SECRET_KEY = Buffer.alloc(16, 1).toString("base64");
    expect(() =>
      criptografarCredenciais({ a: "1" }, "aad"),
    ).toThrow(/32 bytes/);
  });
});
