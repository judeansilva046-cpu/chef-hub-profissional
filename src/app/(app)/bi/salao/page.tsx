import type { Metadata } from "next";

import { BiShell } from "@/features/bi/components/bi-shell";
import { loadBiPage } from "@/features/bi/load-page";

export const metadata: Metadata = {
  title: "BI — Chef Hub Profissional",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BiPage({ searchParams }: Props) {
  const { papel, data, search } = await loadBiPage("salao", searchParams);
  return (
    <BiShell
      dashboard="salao"
      papel={papel}
      data={data}
      path="/bi/salao"
      search={search}
    />
  );
}
