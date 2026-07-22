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
  const { papel, data, search } = await loadBiPage("kds", searchParams);
  return (
    <BiShell
      dashboard="kds"
      papel={papel}
      data={data}
      path="/bi/kds"
      search={search}
    />
  );
}
