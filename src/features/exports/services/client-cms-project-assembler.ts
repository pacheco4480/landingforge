import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";

import type { ClientRuntimeComposition } from "@/features/exports/services/client-runtime-composition";
import { buildClientDeliveryDocumentation } from "@/features/exports/services/client-delivery-documentation";
import {
  collectTemplateStaticAssetPaths,
  packageClientRuntimeAssets,
  packageTemplateStaticAssets,
} from "@/features/exports/services/client-package-assembler";
import { collectClientCmsSourceGraph } from "@/features/exports/services/client-cms-source-graph";

const projectRoot = resolve(process.cwd());
const rootLock = JSON.parse(readFileSync(resolve(projectRoot, "package-lock.json"), "utf8")) as {
  packages: Record<string, { version?: string }>;
};

function lockedVersion(name: string) {
  const version = rootLock.packages[`node_modules/${name}`]?.version ?? (name === "server-only" ? "0.0.1" : undefined);
  if (!version) throw new Error(`A dependência ${name} não tem versão fixada no lockfile.`);
  return version;
}

function writeFile(root: string, path: string, content: string | Uint8Array, overwrite = false) {
  const destination = resolve(root, path);
  const relativePath = relative(root, destination);
  if (!relativePath || relativePath.startsWith(`..${sep}`) || relativePath === "..") throw new Error("O ficheiro gerado excede a pasta temporária.");
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content, { flag: overwrite ? "w" : "wx" });
}

function runtimePath(sourcePath: string) {
  if (!sourcePath.startsWith("src/")) throw new Error("Fonte cliente fora da pasta src.");
  return `src/client-runtime/${sourcePath.slice(4)}`;
}

function rewriteAliases(source: string) {
  return source
    .replaceAll("@/features/", "@/client-runtime/features/")
    .replaceAll("@/components/", "@/client-runtime/components/")
    .replaceAll("@/lib/utils", "@/client-runtime/lib/utils");
}

function snapshotDocument(composition: ClientRuntimeComposition, payload?: ClientRuntimeComposition["payload"]) {
  const bootstrap = composition.cmsBootstrap;
  if (!bootstrap) throw new Error("A composição não contém os dados fixados para bootstrap CMS.");
  const payloadSections = new Map(payload?.page.sections.map((section) => [section.sectionKey, section.content]) ?? []);
  const snapshot = payload
    ? { ...bootstrap.snapshot, page: { ...bootstrap.snapshot.page, sections: bootstrap.snapshot.page.sections.map((section) => ({ ...section, content: payloadSections.get(section.sectionKey) ?? section.content })) } }
    : bootstrap.snapshot;
  const canonical = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error("Snapshot inválido para bootstrap.");
    return encoded;
  };
  const sourceChecksum = createHash("sha256").update(canonical(snapshot)).digest("hex");
  return JSON.stringify({
    projectId: bootstrap.projectId,
    sourceChecksum,
    snapshot,
  }, null, 2) + "\n";
}

function runtimeActions() {
  return `"use server";
import { cookies, headers } from "next/headers";
import { assertClientCmsSubmissionLimit, submitClientCmsLead } from "@/client-runtime/features/exports/client-runtime/cms/form-submission.service";

export async function saveCookieConsent(formData: FormData) {
  const version = String(formData.get("version") ?? "").slice(0, 40);
  if (!version) return;
  const store = await cookies();
  store.set("client-cookie-consent", JSON.stringify({ version, analytics: formData.get("analytics") === "on", marketing: formData.get("marketing") === "on" }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 15552000,
  });
}

export async function submitLead(formData: FormData) {
  const formKey = String(formData.get("formId") ?? "").slice(0, 120);
  const fields: Record<string, string | string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (["formId", "pageId", "gdprConsentVersion", "gdprConsent", "companyWebsite", "cf-turnstile-response"].includes(key) || typeof value !== "string") continue;
    const current = fields[key];
    fields[key] = current === undefined ? value.slice(0, 4000) : Array.isArray(current) ? [...current, value.slice(0, 500)].slice(0, 30) : [current, value.slice(0, 500)].slice(0, 30);
  }
  if (String(formData.get("companyWebsite") ?? "").trim()) return { ok: true, fieldErrors: {}, formError: null };
  try {
    const requestHeaders = await headers();
    const address = requestHeaders.get("x-vercel-forwarded-for") ?? requestHeaders.get("x-real-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0];
    await assertClientCmsSubmissionLimit(address?.slice(0, 100));
    await submitClientCmsLead({ formKey, values: fields, consentGiven: formData.get("gdprConsent") === "yes", consentVersion: String(formData.get("gdprConsentVersion") ?? "").slice(0, 40), honeypot: "", turnstileToken: String(formData.get("cf-turnstile-response") ?? "").slice(0, 4096) });
    return { ok: true, fieldErrors: {}, formError: null };
  } catch {
    return { ok: false, fieldErrors: {}, formError: "Não foi possível enviar o pedido. Verifica a configuração e tenta novamente." };
  }
}
`;
}

function cmsActions() {
  return `"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clientCmsSetFormActive, clientCmsSetLeadStatus, clientCmsSetPageStatus, clientCmsUpdateSection } from "@/client-runtime/features/exports/client-runtime/cms/actions";
import { deleteClientCmsMedia, uploadClientCmsMedia } from "@/client-runtime/features/exports/client-runtime/cms/media.service";

const id = z.string().uuid();
export async function saveSection(formData: FormData) {
  try {
    const pageId = id.parse(formData.get("pageId"));
    const sectionId = id.parse(formData.get("sectionId"));
    const content = JSON.parse(String(formData.get("content") ?? "")) as unknown;
    await clientCmsUpdateSection({ pageId, sectionId, content });
    revalidatePath("/cms/content");
    revalidatePath("/");
  } catch { throw new Error("Não foi possível guardar a secção. Confirma os campos editáveis desta versão."); }
}
export async function setPageStatus(formData: FormData) {
  await clientCmsSetPageStatus({ pageId: id.parse(formData.get("pageId")), status: z.enum(["draft", "published"]).parse(formData.get("status")) });
  revalidatePath("/cms"); revalidatePath("/cms/content"); revalidatePath("/");
}
export async function setFormActive(formData: FormData) {
  await clientCmsSetFormActive({ formId: id.parse(formData.get("formId")), isActive: formData.get("active") === "true" });
  revalidatePath("/cms/forms");
}
export async function setLeadStatus(formData: FormData) {
  await clientCmsSetLeadStatus({ leadId: id.parse(formData.get("leadId")), status: z.enum(["new", "contacted", "converted", "lost"]).parse(formData.get("status")) });
  revalidatePath("/cms/leads");
}
export async function uploadMedia(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Seleciona uma imagem válida.");
  await uploadClientCmsMedia(file, String(formData.get("altText") ?? "").slice(0, 300));
  revalidatePath("/cms/media");
}
export async function deleteMedia(formData: FormData) {
  await deleteClientCmsMedia(id.parse(formData.get("mediaId")));
  revalidatePath("/cms/media");
}
`;
}

function appFiles(composition: ClientRuntimeComposition) {
  const entry = `client-runtime/${composition.template.entrypoint.replace(/^src\//, "").replace(/\.tsx$/, "")}`;
  const entryImport = `@/${entry}`;
  return {
    "app/page.tsx": `import type { Metadata } from "next";\nimport { notFound } from "next/navigation";\nimport { getPublishedClientCmsPayload } from "@/client-runtime/features/exports/client-runtime/cms/public-page.service";\nimport { ClientRuntimeRenderer } from "@/client-runtime/features/exports/client-runtime/renderer";\nimport { clientRuntimeTemplateEntry } from "${entryImport}";\nimport { saveCookieConsent, submitLead } from "./actions";\nexport const dynamic = "force-dynamic";\nexport async function generateMetadata(): Promise<Metadata> { const payload = await getPublishedClientCmsPayload(); if (!payload) return { title: "Página em preparação", robots: { index: false, follow: false } }; const seo = payload.page.seo; return { title: seo?.metaTitle || payload.page.title, description: seo?.metaDescription || undefined, robots: { index: seo?.robotsIndex ?? true, follow: seo?.robotsFollow ?? true } }; }\nexport default async function Home() { const payload = await getPublishedClientCmsPayload(); if (!payload) notFound(); const content = payload.page.sections.map((section) => section.content as Record<string, unknown>); const brand = content.find((item) => item.brandName || item.logoText) ?? {}; const contact = content.find((item) => item.email || item.phone) ?? {}; const site = { businessName: String(brand.brandName ?? brand.logoText ?? payload.page.title), businessType: null, contactEmail: String(contact.email ?? ""), contactPhone: String(contact.phone ?? "") || null, city: String(contact.city ?? "") || null, country: String(contact.country ?? "Portugal"), primaryColor: payload.page.theme.primaryColor, secondaryColor: payload.page.theme.secondaryColor, accentColor: payload.page.theme.accentColor, logoMedia: brand.logoUrl ? { publicUrl: String(brand.logoUrl), altText: String(brand.logoAltText ?? payload.page.title) } : null }; return <ClientRuntimeRenderer payload={payload} templateEntry={clientRuntimeTemplateEntry} site={site} legalSettings={{ privacyPage: { slug: "politica-privacidade", title: "Política de Privacidade" }, cookiePage: { slug: "politica-cookies", title: "Política de Cookies" }, termsPage: { slug: "termos-condicoes", title: "Termos e Condições" }, analyticsCookiesEnabled: false, cookieBannerEnabled: true, marketingCookiesEnabled: false, consentVersion: "1" }} saveConsentAction={saveCookieConsent} submitFormAction={submitLead} turnstileEnabled={Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)} turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null} />; }\n`,
    "app/layout.tsx": `import type { Metadata } from "next";\nimport "./globals.css";\nexport const metadata: Metadata = { metadataBase: new URL(process.env.CLIENT_CMS_SITE_URL || "https://example.invalid") };\nexport default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-PT"><body>{children}</body></html>; }\n`,
    "app/globals.css": `@import "tailwindcss";\n@source "../src/**/*.{ts,tsx}";\n`,
    "app/actions.ts": runtimeActions(),
    "app/api/auth/[...nextauth]/route.ts": `import { handlers } from "@/client-runtime/features/exports/client-runtime/cms/auth";\nexport const { GET, POST } = handlers;\n`,
    "app/cms/actions.ts": cmsActions(),
    "app/cms/login/page.tsx": `import { ClientCmsLoginForm } from "@/client-runtime/features/exports/client-runtime/cms/components/login-form";\nimport Link from "next/link";\nexport default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; reset?: string }> }) { const params = await searchParams; return <><ClientCmsLoginForm error={params.error === "invalid" ? "invalid" : undefined}/><p className="mx-auto -mt-24 max-w-md px-4 text-sm"><Link className="underline" href="/cms/forgot-password">Esqueceste-te da palavra-passe?</Link>{params.reset ? " Palavra-passe atualizada." : ""}</p></>; }\n`,
    "app/cms/forgot-password/page.tsx": `import { clientCmsRequestPasswordResetAction } from "@/client-runtime/features/exports/client-runtime/cms/auth.actions";\nexport default async function Forgot({ searchParams }: { searchParams: Promise<{ sent?: string }> }) { const params = await searchParams; return <main className="mx-auto grid min-h-screen max-w-md content-center gap-5 px-4"><h1 className="text-2xl font-semibold">Recuperar acesso</h1>{params.sent ? <p role="status">Se existir uma conta com esse endereço, receberás instruções.</p> : <form action={clientCmsRequestPasswordResetAction} className="grid gap-4"><label className="grid gap-2">Email<input name="email" type="email" required maxLength={254} autoComplete="email" className="min-h-11 border px-3"/></label><button className="min-h-11 bg-primary px-4 text-primary-foreground">Enviar instruções</button></form>}</main>; }\n`,
    "app/cms/reset-password/page.tsx": `import { clientCmsResetPasswordAction } from "@/client-runtime/features/exports/client-runtime/cms/auth.actions";\nexport default async function Reset({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) { const params = await searchParams; return <main className="mx-auto grid min-h-screen max-w-md content-center gap-5 px-4"><h1 className="text-2xl font-semibold">Definir nova palavra-passe</h1>{params.error ? <p role="alert">O link expirou ou já foi utilizado.</p> : null}<form action={clientCmsResetPasswordAction} className="grid gap-4"><input type="hidden" name="token" value={params.token ?? ""}/><label className="grid gap-2">Nova palavra-passe<input name="password" type="password" required minLength={12} maxLength={200} autoComplete="new-password" className="min-h-11 border px-3"/></label><button className="min-h-11 bg-primary px-4 text-primary-foreground">Atualizar palavra-passe</button></form></main>; }\n`,
    "app/cms/(workspace)/layout.tsx": `import Link from "next/link";\nimport { redirect } from "next/navigation";\nimport { auth } from "@/client-runtime/features/exports/client-runtime/cms/auth";\nimport { clientCmsLogoutAction } from "@/client-runtime/features/exports/client-runtime/cms/auth.actions";\nexport const dynamic = "force-dynamic";\nexport default async function Workspace({ children }: { children: React.ReactNode }) { const session = await auth(); if (!session?.user) redirect("/cms/login"); return <><header className="border-b"><nav aria-label="Gestão da landing" className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4"><Link className="font-semibold" href="/cms">CMS da landing</Link><Link href="/cms/content">Conteúdo</Link><Link href="/cms/forms">Formulários</Link><Link href="/cms/leads">Contactos</Link><Link href="/cms/media">Media</Link><span className="ml-auto text-sm">{session.user.name}</span><form action={clientCmsLogoutAction}><button className="underline">Terminar sessão</button></form></nav></header>{children}</>; }\n`,
    "app/cms/(workspace)/page.tsx": `import { ClientCmsDashboard } from "@/client-runtime/features/exports/client-runtime/cms/components/dashboard";\nimport { clientCmsGetDashboard } from "@/client-runtime/features/exports/client-runtime/cms/actions";\nimport { clientCmsGetPage, clientCmsGetForms, clientCmsGetLeads } from "@/client-runtime/features/exports/client-runtime/cms/actions";\nexport default async function Dashboard() { const [summary, page, forms, leads] = await Promise.all([clientCmsGetDashboard(), clientCmsGetPage(), clientCmsGetForms(), clientCmsGetLeads()]); return <ClientCmsDashboard businessName={String(page?.title ?? "A sua landing")} installation={{ projectId: process.env.CLIENT_CMS_PROJECT_ID ?? "", templateKey: summary.templateKey, variantKey: summary.variantKey, templateVersion: summary.templateVersion, sourceChecksum: "", capabilities: [] }} sectionCount={Number(summary.sections)} formCount={forms.length} newLeadCount={leads.filter((lead: {status: string}) => lead.status === "new").length}/>; }\n`,
    "app/cms/(workspace)/content/page.tsx": `import { clientCmsGetPage } from "@/client-runtime/features/exports/client-runtime/cms/actions";\nimport { saveSection, setPageStatus } from "../../actions";\nexport default async function Content() { const page = await clientCmsGetPage(); if (!page) return <main className="mx-auto max-w-5xl p-6">Não existe conteúdo provisionado.</main>; return <main className="mx-auto grid max-w-5xl gap-6 p-6"><header><h1 className="text-2xl font-semibold">Conteúdo da landing</h1><p className="mt-2 text-sm text-muted-foreground">Edita apenas os campos previstos para esta versão do template.</p></header><p>Estado: {page.status === "published" ? "Publicado" : "Rascunho"}</p><form action={setPageStatus} className="flex flex-wrap gap-3"><input type="hidden" name="pageId" value={page.id}/><button name="status" value="published" className="min-h-10 bg-primary px-4 text-primary-foreground">Publicar</button><button name="status" value="draft" className="min-h-10 border px-4">Retirar publicação</button></form>{page.sections.map((section: {id:string;name:string;section_type:string;content:unknown}) => <form action={saveSection} key={section.id} className="grid gap-3 border p-4"><h2 className="font-semibold">{section.name} <span className="text-sm font-normal text-muted-foreground">· {section.section_type}</span></h2><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="sectionId" value={section.id}/><label className="grid gap-2 text-sm">Campos editáveis (JSON)<textarea name="content" required rows={Math.min(18, Math.max(6, JSON.stringify(section.content).length / 90))} defaultValue={JSON.stringify(section.content, null, 2)} className="min-h-40 w-full border p-3 font-mono text-xs"/></label><button className="min-h-10 w-fit bg-primary px-4 text-primary-foreground">Guardar secção</button></form>)}</main>; }\n`,
    "app/cms/(workspace)/forms/page.tsx": `import { clientCmsGetForms } from "@/client-runtime/features/exports/client-runtime/cms/actions";\nimport { setFormActive } from "../../actions";\nexport default async function Forms() { const forms = await clientCmsGetForms(); return <main className="mx-auto grid max-w-5xl gap-5 p-6"><h1 className="text-2xl font-semibold">Formulários</h1>{forms.map((form: {id:string;name:string;form_key:string;is_active:boolean;fields:unknown[]}) => <section key={form.id} className="grid gap-3 border p-4"><h2 className="font-semibold">{form.name}</h2><p className="text-sm text-muted-foreground">{form.form_key} · {form.fields.length} campos · {form.is_active ? "Ativo" : "Inativo"}</p><form action={setFormActive}><input type="hidden" name="formId" value={form.id}/><input type="hidden" name="active" value={String(!form.is_active)}/><button className="min-h-10 border px-4">{form.is_active ? "Desativar" : "Ativar"}</button></form></section>)}</main>; }\n`,
    "app/cms/(workspace)/leads/page.tsx": `import { clientCmsGetLeads } from "@/client-runtime/features/exports/client-runtime/cms/actions";\nimport { setLeadStatus } from "../../actions";\nexport default async function Leads() { const leads = await clientCmsGetLeads(); return <main className="mx-auto grid max-w-5xl gap-5 p-6"><h1 className="text-2xl font-semibold">Contactos recebidos</h1>{leads.length ? leads.map((lead: {id:string;name:string|null;email:string|null;phone:string|null;company:string|null;message:string|null;status:string;created_at:Date}) => <article key={lead.id} className="grid gap-3 border p-4"><div><h2 className="font-semibold">{lead.name || lead.company || "Novo contacto"}</h2><p className="text-sm">{lead.email || "Sem email"}{lead.phone ? " · " + lead.phone : ""}</p><p className="mt-2 whitespace-pre-wrap text-sm">{lead.message}</p><p className="mt-2 text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lead.created_at))}</p></div><form action={setLeadStatus} className="flex flex-wrap items-center gap-2"><input type="hidden" name="leadId" value={lead.id}/><label htmlFor={"status-" + lead.id} className="text-sm">Estado</label><select id={"status-" + lead.id} name="status" defaultValue={lead.status} className="min-h-10 border px-2"><option value="new">Novo</option><option value="contacted">Contactado</option><option value="converted">Convertido</option><option value="lost">Sem seguimento</option></select><button className="min-h-10 border px-3">Guardar</button></form></article>) : <p>Ainda não existem contactos.</p>}</main>; }\n`,
    "app/cms/(workspace)/media/page.tsx": `import { listClientCmsMedia } from "@/client-runtime/features/exports/client-runtime/cms/media.service";\nimport { deleteMedia, uploadMedia } from "../../actions";\nexport default async function Media() { const media = await listClientCmsMedia(); return <main className="mx-auto grid max-w-5xl gap-6 p-6"><h1 className="text-2xl font-semibold">Biblioteca de media</h1><form action={uploadMedia} className="grid gap-3 border p-4 sm:grid-cols-[1fr_1fr_auto]"><label className="grid gap-2 text-sm">Imagem<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="min-h-11"/></label><label className="grid gap-2 text-sm">Texto alternativo<input name="altText" maxLength={300} className="min-h-11 border px-3"/></label><button className="min-h-11 self-end bg-primary px-4 text-primary-foreground">Carregar imagem</button></form><p className="text-sm text-muted-foreground">JPEG, PNG, WebP ou AVIF até 10 MB. O storage do cliente tem de estar configurado.</p>{media.length ? <ul className="grid gap-3">{media.map((item: {id:string;filename:string;mime_type:string;size_bytes:number;alt_text:string|null;object_path:string}) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 border p-4"><div><p className="font-medium">{item.filename}</p><p className="text-xs text-muted-foreground">{item.mime_type} · {Math.ceil(item.size_bytes/1024)} KB · {item.alt_text || "Sem texto alternativo"}</p></div><form action={deleteMedia}><input type="hidden" name="mediaId" value={item.id}/><button className="min-h-10 border px-3">Eliminar</button></form></li>)}</ul> : <p>A biblioteca ainda não tem imagens.</p>}</main>; }\n`,
    "app/politica-privacidade/page.tsx": `export const metadata = { title: "Política de Privacidade", robots: { index: false, follow: false } }; export default function Legal() { return <main className="mx-auto max-w-3xl px-6 py-20"><h1 className="text-3xl font-semibold">Política de Privacidade</h1><p className="mt-4">Esta página deve ser revista e preenchida com a informação do responsável pelo tratamento antes da publicação.</p></main>; }\n`,
    "app/politica-cookies/page.tsx": `export const metadata = { title: "Política de Cookies", robots: { index: false, follow: false } }; export default function Legal() { return <main className="mx-auto max-w-3xl px-6 py-20"><h1 className="text-3xl font-semibold">Política de Cookies</h1><p className="mt-4">Esta página deve ser revista e preenchida antes da publicação.</p></main>; }\n`,
    "app/termos-condicoes/page.tsx": `export const metadata = { title: "Termos e Condições", robots: { index: false, follow: false } }; export default function Legal() { return <main className="mx-auto max-w-3xl px-6 py-20"><h1 className="text-3xl font-semibold">Termos e Condições</h1><p className="mt-4">Esta página deve ser revista e preenchida antes da publicação.</p></main>; }\n`,
  };
}

function deploymentDocs(composition: ClientRuntimeComposition) {
  const projectId = composition.cmsBootstrap?.projectId ?? "";
  return {
    "client-docs/DEPLOYMENT.md": `# Instalação e publicação · Landing + CMS\n\nEsta pasta contém a landing e um CMS dedicado a um único projeto. Não contém o CMS Master, CRM, briefs, tasks, prompts, documentação interna nem credenciais.\n\n## 1. Requisitos\n- Node.js 20 ou superior e npm.\n- PostgreSQL dedicado a esta instalação (nunca a base de dados Master). Em produção, TLS obrigatório.\n- Projeto Supabase do cliente e bucket público dedicado a imagens públicas da landing.\n- Domínio e alojamento Next.js compatível com Server Actions/Auth.js.\n\n## 2. Configuração\nCopia .env.example para .env.local e preenche os valores usando credenciais do cliente. Define CLIENT_CMS_PROJECT_ID=${projectId} e a versão ${composition.payload.templateVersion}. Gera AUTH_SECRET e CLIENT_CMS_RATE_LIMIT_SECRET de forma independente; nunca reutilizes segredos LandingForge. Configura URL da base, SSL/TLS, Supabase, bucket e, opcionalmente, Turnstile/Resend.\n\n## 3. Instalar a base de dados\nExecuta npm install, confirma o host, porta e nome da base dedicada, e depois npm run cms:migrate. O runner aplica apenas migrations novas e não executa seeds. Não aponta para a base Master.\n\n## 4. Primeiro acesso\nDefine temporariamente CLIENT_CMS_INITIAL_ADMIN_NAME, CLIENT_CMS_INITIAL_ADMIN_EMAIL e CLIENT_CMS_INITIAL_ADMIN_PASSWORD (mínimo 12 caracteres). Corre npm run cms:bootstrap uma vez. Remove a password inicial do ambiente após sucesso e guarda-a num gestor de passwords. A repetição verifica a versão/checksum e não repõe conteúdo nem leads; se já existir utilizador, não cria outro.\n\n## 5. Build e publicação\nCorre npm run typecheck, npm run build e publica a aplicação no alojamento do cliente. Define CLIENT_CMS_SITE_URL para o domínio final e os URLs/Auth.js necessários. Confirma login, edição de uma secção, publicação, formulário, lead, upload e recuperação de password em ambiente de teste antes de anunciar.\n\n## Dados e atualizações\nFaz backups de PostgreSQL e Storage. Atualizações de código aplicam migrations incrementais, não executam bootstrap automaticamente e não sobrescrevem dados. Mantém a versão fixada compatível. A troca de versão do template é uma operação explícita e não faz rebase automático.\n\nEsta entrega não está certificada operacionalmente até concluir a validação do cliente/hosting/serviços (TASK 044G).\n`,
    "client-docs/PRIMEIRO-ACESSO.md": `# Primeiro acesso ao CMS\n\n1. Abre o endereço /cms/login no domínio configurado.\n2. Entra com o utilizador inicial criado no bootstrap e altera a password se necessário.\n3. Em **Conteúdo**, edita apenas os campos autorizados para o template fixado; guarda e publica quando revisto.\n4. Em **Formulários**, ativa só formulários completos e testados.\n5. Em **Contactos**, acompanha o estado dos pedidos recebidos.\n6. Em **Media**, carrega imagens autorizadas. Não elimines imagens em uso.\n7. Configura o serviço de email/anti-spam se aplicável e envia um pedido de teste.\n\nO CMS é exclusivo deste projeto. Não partilhes credenciais por email e ativa backups regulares.\n`,
    "client-docs/ANTES-DE-PUBLICAR.md": `# Antes de publicar\n\n- Preenche e valida as páginas de privacidade, cookies e termos com o responsável legal.\n- Confirma direitos de utilização dos assets.\n- Verifica domínio, HTTPS, SEO, formulário, consentimento, login e permissões.\n- Confirma backups e acesso de recuperação.\n- As credenciais são fornecidas pelo cliente e configuradas no ambiente privado; não as guardes no repositório.\n`,
    ...buildClientDeliveryDocumentation(composition),
  };
}

function packageEnvironment(composition: ClientRuntimeComposition) {
  const bootstrap = composition.cmsBootstrap;
  if (!bootstrap) throw new Error("A composição não contém os dados fixados para bootstrap CMS.");
  return `CLIENT_CMS_DATABASE_URL=\nCLIENT_CMS_DATABASE_SSL=true\nCLIENT_CMS_DB_POOL_SIZE=5\nCLIENT_CMS_PROJECT_ID=${bootstrap.projectId}\nCLIENT_CMS_TEMPLATE_VERSION=${composition.payload.templateVersion}\nCLIENT_CMS_SITE_URL=https://example.com\nAUTH_SECRET=\nAUTH_URL=https://example.com\nCLIENT_CMS_RATE_LIMIT_SECRET=\nCLIENT_CMS_SUPABASE_URL=\nCLIENT_CMS_SUPABASE_SERVICE_ROLE_KEY=\nCLIENT_CMS_PUBLIC_MEDIA_BUCKET=\nNEXT_PUBLIC_TURNSTILE_SITE_KEY=\nTURNSTILE_SECRET_KEY=\nCLIENT_CMS_RESEND_API_KEY=\nCLIENT_CMS_EMAIL_FROM=\nCLIENT_CMS_INITIAL_ADMIN_NAME=\nCLIENT_CMS_INITIAL_ADMIN_EMAIL=\nCLIENT_CMS_INITIAL_ADMIN_PASSWORD=\n`;
}

export function assembleClientCmsProject(composition: ClientRuntimeComposition, destinationRoot: string) {
  if (composition.mode !== "LANDING_WITH_CMS") throw new Error("A composição não está no modo Landing + CMS.");
  const temporaryRoot = resolve(tmpdir());
  const parent = resolve(dirname(destinationRoot));
  const parentRelative = relative(temporaryRoot, parent);
  if (!parentRelative || parentRelative === ".." || parentRelative.startsWith(`..${sep}`) || resolve(destinationRoot).startsWith(`${projectRoot}${sep}`)) {
    throw new Error("A aplicação CMS só pode ser montada numa pasta temporária fora do repositório.");
  }
  if (existsSync(destinationRoot)) throw new Error("O destino CMS já existe.");
  mkdirSync(destinationRoot, { recursive: false });
  try {
    const graph = collectClientCmsSourceGraph(composition.template.key, composition.template.variantKey);
    const packagedSources: string[] = [];
    for (const source of graph.files) {
      const from = resolve(projectRoot, source);
      if (lstatSync(from).isSymbolicLink()) throw new Error(`Fonte CMS não permitida: ${source}`);
      const output = runtimePath(source);
      const content = /\.[jt]sx?$/.test(extname(source)) ? rewriteAliases(readFileSync(from, "utf8")) : readFileSync(from);
      writeFile(destinationRoot, output, content);
      packagedSources.push(output);
    }
    const staticAssetSources = composition.template.sourceFiles.map((path) => ({
      path,
      source: readFileSync(resolve(projectRoot, path), "utf8"),
    }));
    packageTemplateStaticAssets(
      collectTemplateStaticAssetPaths(staticAssetSources, composition.template.key),
      composition.template.key,
      destinationRoot,
    );

    for (const [path, content] of Object.entries(appFiles(composition))) writeFile(destinationRoot, path, content);
    for (const migration of readdirSync(resolve(projectRoot, "prisma/client-runtime/migrations")).filter((name) => name.endsWith(".sql")).sort()) {
      const source = resolve(projectRoot, "prisma/client-runtime/migrations", migration);
      if (lstatSync(source).isSymbolicLink()) throw new Error("Migration CMS em symlink rejeitada.");
      writeFile(destinationRoot, `migrations/${migration}`, readFileSync(source));
    }
    writeFile(destinationRoot, "cms/capabilities.json", JSON.stringify({ templateVersion: composition.payload.templateVersion, sections: composition.cmsBootstrap?.snapshot.capabilities.sections ?? [] }, null, 2) + "\n");
    writeFile(destinationRoot, "auth/README.md", "# Autenticação CMS\n\nO pacote usa Auth.js Credentials com utilizadores limitados a esta instalação. Configura AUTH_SECRET e AUTH_URL no ambiente privado do cliente.\n");
    writeFile(destinationRoot, "database/initial-snapshot.json", snapshotDocument(composition));
    writeFile(destinationRoot, ".env.example", packageEnvironment(composition));
    writeFile(destinationRoot, "deployment/client-cms-project-manifest.json", JSON.stringify({
      format: "landingforge-client-cms-package", formatVersion: 1, mode: composition.mode,
      template: composition.template, templateVersion: composition.payload.templateVersion,
      sourceFiles: packagedSources, migrations: readdirSync(resolve(projectRoot, "prisma/client-runtime/migrations")).filter((name) => name.endsWith(".sql")).sort(),
      credentialsCopied: false, buildVerified: false, tenantIsolationVerified: false,
    }, null, 2) + "\n");
    writeFile(destinationRoot, "scripts/client-cms-bootstrap.ts", `import dotenv from "dotenv";\ndotenv.config({ path: ".env.local" });\nimport { readFile } from "node:fs/promises";\nimport { resolve } from "node:path";\nimport { bootstrapClientCmsInstallation, createInitialClientCmsAdmin } from "@/client-runtime/features/exports/client-runtime/cms/bootstrap.service";\nimport { closeClientCmsPool } from "@/client-runtime/features/exports/client-runtime/cms/database";\nasync function main() { const projectId = process.env.CLIENT_CMS_PROJECT_ID; const name = process.env.CLIENT_CMS_INITIAL_ADMIN_NAME; const email = process.env.CLIENT_CMS_INITIAL_ADMIN_EMAIL; const password = process.env.CLIENT_CMS_INITIAL_ADMIN_PASSWORD; if (!projectId || !name || !email || !password) throw new Error("Configura as variáveis do Project e do administrador inicial."); const snapshot = JSON.parse(await readFile(resolve("database/initial-snapshot.json"), "utf8")); if (snapshot.projectId !== projectId) throw new Error("O snapshot não corresponde ao Project configurado."); const installation = await bootstrapClientCmsInstallation(snapshot); const admin = await createInitialClientCmsAdmin({ projectId, name, email, password }); process.stdout.write(JSON.stringify({ installation, administrator: admin }) + "\\n"); }\nmain().finally(closeClientCmsPool).catch((error) => { process.stderr.write((error instanceof Error ? error.message : "Falha no bootstrap") + "\\n"); process.exitCode = 1; });\n`);
    writeFile(destinationRoot, "deployment/migrate-client-cms.mjs", `import dotenv from "dotenv";\ndotenv.config({ path: ".env.local" });\nimport { readdir, readFile } from "node:fs/promises";\nimport { resolve } from "node:path";\nimport pg from "pg";\nconst url = process.env.CLIENT_CMS_DATABASE_URL?.trim(); if (!url) throw new Error("Define CLIENT_CMS_DATABASE_URL."); const parsed = new URL(url); if (!/^postgres(?:ql)?:$/.test(parsed.protocol)) throw new Error("A instalação CMS requer PostgreSQL."); if (process.env.NODE_ENV === "production" && parsed.hostname !== "localhost" && process.env.CLIENT_CMS_DATABASE_SSL !== "true" && parsed.searchParams.get("sslmode") !== "require") throw new Error("TLS é obrigatório em produção."); const master = process.env.DATABASE_URL?.trim(); if (master && new URL(master).hostname.toLowerCase() === parsed.hostname.toLowerCase() && (new URL(master).port || "5432") === (parsed.port || "5432") && decodeURIComponent(new URL(master).pathname) === decodeURIComponent(parsed.pathname)) throw new Error("A base Master não pode ser usada."); const pool = new pg.Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 5000 }); try { await pool.query("CREATE TABLE IF NOT EXISTS lf_cms_schema_migrations (migration_name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"); for (const name of (await readdir("migrations")).filter((item) => item.endsWith(".sql")).sort()) { if ((await pool.query("SELECT 1 FROM lf_cms_schema_migrations WHERE migration_name=$1", [name])).rowCount) continue; const client = await pool.connect(); try { await client.query("BEGIN"); await client.query(await readFile(resolve("migrations", name), "utf8")); await client.query("INSERT INTO lf_cms_schema_migrations(migration_name) VALUES ($1)", [name]); await client.query("COMMIT"); console.log("Aplicada", name); } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); } } } finally { await pool.end(); }\n`);
    for (const [path, content] of Object.entries(deploymentDocs(composition))) writeFile(destinationRoot, path, content);
    writeFile(destinationRoot, "package.json", JSON.stringify({
      name: "landingforge-client-cms", version: "1.0.0", private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start", typecheck: "tsc --noEmit", "cms:migrate": "node deployment/migrate-client-cms.mjs", "cms:bootstrap": "node --conditions=react-server --import tsx scripts/client-cms-bootstrap.ts" },
      dependencies: Object.fromEntries(graph.dependencies.map((name) => [name, lockedVersion(name)]).concat([["next", lockedVersion("next")], ["react", lockedVersion("react")], ["react-dom", lockedVersion("react-dom")], ["dotenv", lockedVersion("dotenv")]])),
      devDependencies: Object.fromEntries(["@tailwindcss/postcss", "@types/node", "@types/pg", "@types/react", "@types/react-dom", "tailwindcss", "tsx", "typescript"].map((name) => [name, lockedVersion(name)])),
    }, null, 2) + "\n");
    writeFile(destinationRoot, "next.config.ts", `import type { NextConfig } from "next";\nconst config: NextConfig = { images: { unoptimized: true }, experimental: { serverActions: { bodySizeLimit: "12mb" } } };\nexport default config;\n`);
    writeFile(destinationRoot, "postcss.config.mjs", `export default { plugins: { "@tailwindcss/postcss": {} } };\n`);
    writeFile(destinationRoot, "tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] } }, include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"] }, null, 2) + "\n");
    writeFile(destinationRoot, "deployment/package-lock-policy.json", JSON.stringify({ generatedWith: "npm install", scriptsRequiredForNativeAuth: true, trustedDependencies: ["argon2"], credentialsCopied: false }, null, 2) + "\n");
    return { destination: destinationRoot, files: packagedSources, templateVersion: composition.payload.templateVersion };
  } catch (error) {
    rmSync(destinationRoot, { recursive: true, force: true });
    throw error;
  }
}

export async function assembleAuditedClientCmsPackage(composition: ClientRuntimeComposition, tenantIsolationPassed: boolean) {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), "landingforge-cms-export-"));
  const destination = resolve(temporaryRoot, "client-cms");
  try {
    assembleClientCmsProject(composition, destination);
    const assetResult = await packageClientRuntimeAssets(composition.payload, destination);
    writeFile(destination, "src/client-runtime-payload.json", JSON.stringify(assetResult.payload, null, 2) + "\n");
    writeFile(destination, "database/initial-snapshot.json", snapshotDocument(composition, assetResult.payload as ClientRuntimeComposition["payload"]), true);
    const { runIndependentBuild, walkClientPackage, createAuditedClientPackageArchive } = await import("@/features/exports/services/client-package-assembler");
    runIndependentBuild(destination, temporaryRoot, true);
    const manifestPath = resolve(destination, "deployment/client-cms-project-manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    manifest.buildVerified = true;
    manifest.tenantIsolationVerified = tenantIsolationPassed;
    writeFile(destination, "deployment/client-cms-project-manifest.json", JSON.stringify(manifest, null, 2) + "\n", true);
    const entries = walkClientPackage(destination);
    const audit = (await import("@/features/exports/services/client-package-audit")).auditClientPackage({ mode: "LANDING_WITH_CMS", entries, isolatedBuildPassed: true, tenantIsolationPassed });
    if (!audit.ready) return { archive: new Uint8Array(), audit, checksum: "", fileCount: audit.fileCount, totalBytes: audit.totalBytes, assetCount: assetResult.assetCount, assetBytes: assetResult.assetBytes, templateVersion: composition.payload.templateVersion };
    const archive = createAuditedClientPackageArchive(entries, true, "LANDING_WITH_CMS", tenantIsolationPassed);
    return { archive, audit, checksum: createHash("sha256").update(archive).digest("hex"), fileCount: audit.fileCount, totalBytes: audit.totalBytes, assetCount: assetResult.assetCount, assetBytes: assetResult.assetBytes, templateVersion: composition.payload.templateVersion };
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}
