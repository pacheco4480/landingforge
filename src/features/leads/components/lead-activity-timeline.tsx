type ActivityRow = {
  id: string;
  action: string;
  createdAt: Date;
  user: { name: string | null; email: string } | null;
};

const actionLabels: Record<string, string> = {
  "lead.status.update": "Estado alterado",
  "lead_note.create": "Nota adicionada",
  "lead_note.update": "Nota editada",
  "lead_note.delete": "Nota eliminada",
};

export function LeadActivityTimeline({
  createdAt,
  convertedAt,
  lostAt,
  activity,
}: {
  createdAt: Date;
  convertedAt: Date | null;
  lostAt: Date | null;
  activity: ActivityRow[];
}) {
  const events = [
    { id: "created", label: "Lead criado", createdAt, actor: "Sistema" },
    convertedAt
      ? {
          id: "converted",
          label: "Lead convertido",
          createdAt: convertedAt,
          actor: "Sistema",
        }
      : null,
    lostAt
      ? {
          id: "lost",
          label: "Lead perdido",
          createdAt: lostAt,
          actor: "Sistema",
        }
      : null,
    ...activity.map((item) => ({
      id: item.id,
      label: actionLabels[item.action] ?? item.action,
      createdAt: item.createdAt,
      actor: item.user?.name ?? item.user?.email ?? "Sistema",
    })),
  ]
    .filter((item): item is { id: string; label: string; createdAt: Date; actor: string } =>
      Boolean(item),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <ol className="grid gap-3">
      {events.map((event) => (
        <li className="border-border rounded-md border p-3" key={event.id}>
          <p className="text-sm font-semibold">{event.label}</p>
          <p className="text-muted-foreground text-xs">
            {event.actor} · {event.createdAt.toLocaleString("pt-PT")}
          </p>
        </li>
      ))}
    </ol>
  );
}
