const deploymentLabels: Record<string, string> = {
  INTERNAL_DEMO: "Demonstração interna",
  CLIENT: "Cliente",
  LOCAL: "Local",
  PREVIEW: "Pré-visualização",
  PRODUCTION: "Produção",
  NOT_STARTED: "Por iniciar",
  CONFIGURING: "Em configuração",
  READY: "Pronto",
  LIVE: "Publicado",
  BLOCKED: "Bloqueado",
  NOT_CONFIGURED: "Não configurado",
  PENDING: "Pendente",
  CONNECTED: "Ligado",
  ERROR: "Erro",
  ACTIVE: "Activo",
};

export function deploymentDisplayLabel(value: string | boolean) {
  if (typeof value === "boolean") return value ? "Activo" : "Inactivo";
  return deploymentLabels[value] ?? value;
}
