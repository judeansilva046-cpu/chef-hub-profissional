export function BiExportLinks({
  dashboard,
  dataInicio,
  dataFim,
}: {
  dashboard: string;
  dataInicio: string;
  dataFim: string;
}) {
  const base = `/api/bi/export?dashboard=${encodeURIComponent(dashboard)}&dataInicio=${dataInicio}&dataFim=${dataFim}`;
  const cls =
    "border-border bg-background hover:bg-muted inline-flex h-8 items-center rounded-md border px-3 text-sm";
  return (
    <div className="flex flex-wrap gap-2">
      <a className={cls} href={`${base}&formato=csv`}>
        CSV
      </a>
      <a className={cls} href={`${base}&formato=excel`}>
        Excel
      </a>
      <a className={cls} href={`${base}&formato=pdf`}>
        PDF
      </a>
    </div>
  );
}
