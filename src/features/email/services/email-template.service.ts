type EmailBranding = {
  businessName: string;
  siteName: string;
  primaryColor: string;
  contactEmail: string;
  logoUrl?: string | null;
};

export type DigestMetrics = {
  periodLabel: string;
  total: number;
  newLeads: number;
  contacted: number;
  inNegotiation: number;
  converted: number;
  lost: number;
  recentLeads: Array<{
    name: string;
    email: string;
    source: string;
    createdAt: Date;
  }>;
};

export function renderPasswordResetEmail(input: {
  resetUrl: string;
  branding: EmailBranding;
}) {
  const subject = "Redefinir password do LandingForge";
  const text = `Redefine a tua password: ${input.resetUrl}`;
  const html = renderEmailLayout({
    branding: input.branding,
    title: "Redefinir password",
    body: `<p>Recebemos um pedido para redefinir a tua password.</p><p><a href="${escapeHtml(input.resetUrl)}">Redefinir password</a></p><p>Este link expira em 30 minutos.</p>`,
  });
  return { subject, text, html };
}

export function renderWelcomeEmail(input: {
  dashboardUrl: string;
  branding: EmailBranding;
}) {
  const subject = `Bem-vindo ao ${input.branding.siteName}`;
  const text = `Bem-vindo. Acede ao dashboard: ${input.dashboardUrl}`;
  const html = renderEmailLayout({
    branding: input.branding,
    title: "Bem-vindo",
    body: `<p>A tua conta está pronta.</p><p><a href="${escapeHtml(input.dashboardUrl)}">Abrir dashboard</a></p>`,
  });
  return { subject, text, html };
}

export function renderDigestEmail(input: {
  branding: EmailBranding;
  metrics: DigestMetrics;
}) {
  const subject = `${input.branding.businessName}: resumo de leads`;
  const text = [
    `Resumo de leads (${input.metrics.periodLabel})`,
    `Total: ${input.metrics.total}`,
    `Novos: ${input.metrics.newLeads}`,
    `Contactados: ${input.metrics.contacted}`,
    `Em negociação: ${input.metrics.inNegotiation}`,
    `Convertidos: ${input.metrics.converted}`,
    `Perdidos: ${input.metrics.lost}`,
  ].join("\n");

  const rows = [
    ["Total", input.metrics.total],
    ["Novos", input.metrics.newLeads],
    ["Contactados", input.metrics.contacted],
    ["Em negociação", input.metrics.inNegotiation],
    ["Convertidos", input.metrics.converted],
    ["Perdidos", input.metrics.lost],
  ]
    .map(
      ([label, value]) =>
        `<tr><td>${label}</td><td style="text-align:right;font-weight:700">${value}</td></tr>`,
    )
    .join("");

  const recent = input.metrics.recentLeads.length
    ? `<ul>${input.metrics.recentLeads
        .map(
          (lead) =>
            `<li><strong>${escapeHtml(lead.name)}</strong><br><span>${escapeHtml(lead.email)} · ${escapeHtml(lead.source)}</span></li>`,
        )
        .join("")}</ul>`
    : "<p>Sem leads recentes para listar.</p>";

  const html = renderEmailLayout({
    branding: input.branding,
    title: `Resumo de leads: ${input.metrics.periodLabel}`,
    body: `<p>Segue o resumo da atividade recente das landing pages.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="8">${rows}</table><h2>Leads recentes</h2>${recent}`,
  });

  return { subject, text, html };
}

export function renderLeadNotificationEmail(input: {
  branding: EmailBranding;
  to: string;
  formName: string;
  pageTitle?: string | null;
  pageSlug?: string | null;
  submittedAt: Date;
  lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    message: string | null;
    source: string | null;
  };
}) {
  const leadName = input.lead.name ?? "Novo contacto";
  const subject = `${input.branding.businessName}: novo lead recebido`;
  const pageLabel = input.pageTitle ?? input.pageSlug ?? "Landing page";
  const submittedAt = input.submittedAt.toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const rows = [
    ["Nome", input.lead.name],
    ["Email", input.lead.email],
    ["Telefone", input.lead.phone],
    ["Empresa", input.lead.company],
    ["Mensagem", input.lead.message],
    ["Origem", input.lead.source],
    ["Pagina", pageLabel],
    ["Data", submittedAt],
  ]
    .filter(([, value]) => Boolean(value))
    .map(
      ([label, value]) =>
        `<tr><td style="color:#637083">${escapeHtml(label ?? "")}</td><td style="font-weight:700">${escapeHtml(value ?? "")}</td></tr>`,
    )
    .join("");

  const text = [
    `Novo lead recebido em ${input.formName}`,
    `Nome: ${leadName}`,
    input.lead.email ? `Email: ${input.lead.email}` : null,
    input.lead.phone ? `Telefone: ${input.lead.phone}` : null,
    input.lead.message ? `Mensagem: ${input.lead.message}` : null,
    `Pagina: ${pageLabel}`,
    `Data: ${submittedAt}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = renderEmailLayout({
    branding: input.branding,
    title: "Novo lead recebido",
    body: `<p>Foi submetido um novo pedido atraves do formulario <strong>${escapeHtml(input.formName)}</strong>.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="8">${rows}</table>`,
  });

  return { subject, text, html };
}

function renderEmailLayout({
  branding,
  title,
  body,
}: {
  branding: EmailBranding;
  title: string;
  body: string;
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f7f8;color:#172026;font-family:Arial,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:24px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dde2e6;border-radius:8px;overflow:hidden">
            <tr>
              <td style="padding:24px;border-bottom:4px solid ${escapeHtml(branding.primaryColor)}">
                ${branding.logoUrl ? `<img src="${escapeHtml(branding.logoUrl)}" alt="${escapeHtml(branding.businessName)}" style="max-height:40px;margin-bottom:12px">` : ""}
                <p style="margin:0;color:#637083;font-size:13px">${escapeHtml(branding.siteName)}</p>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr><td style="padding:24px;font-size:15px;line-height:1.6">${body}</td></tr>
            <tr>
              <td style="padding:18px 24px;background:#f6f7f8;color:#637083;font-size:12px">
                ${escapeHtml(branding.businessName)} · ${escapeHtml(branding.contactEmail)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
