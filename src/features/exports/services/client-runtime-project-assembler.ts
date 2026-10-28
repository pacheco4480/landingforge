import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";

import type { ClientRuntimeComposition } from "@/features/exports/services/client-runtime-composition";
import { buildClientDeliveryDocumentation } from "@/features/exports/services/client-delivery-documentation";
import { assembleClientRuntimeSourceFiles } from "@/features/exports/services/client-runtime-source-assembler";
import { collectClientRuntimeSourceGraph, isTemplateScopedRuntimeSourcePath } from "@/features/exports/services/client-runtime-source-graph";

const projectRoot = realpathSync(process.cwd());
const rootPackage = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};
const rootLockfile = JSON.parse(readFileSync(resolve(projectRoot, "package-lock.json"), "utf8")) as {
  packages: Record<string, { version?: string }>;
};

function lockedVersion(packageName: string) {
  const version = rootLockfile.packages[`node_modules/${packageName}`]?.version;
  if (!version) throw new Error(`A dependência ${packageName} não tem versão fixada no lockfile do projeto.`);
  return version;
}

function ensureTemporaryDestination(destinationRoot: string) {
  const destination = resolve(destinationRoot);
  const temporaryRoot = realpathSync(tmpdir());
  const parent = realpathSync(dirname(destination));
  const relativeParent = relative(temporaryRoot, parent);
  if (!relativeParent || relativeParent === ".." || relativeParent.startsWith(`..${sep}`) || relativeParent.startsWith(sep)) {
    throw new Error("A aplicação cliente só pode ser criada numa pasta temporária dedicada.");
  }
  if (destination === projectRoot || destination.startsWith(`${projectRoot}${sep}`)) {
    throw new Error("A aplicação cliente não pode ser criada dentro do repositório Master.");
  }
  if (existsSync(destination)) throw new Error("O destino da aplicação já existe.");
  mkdirSync(destination, { recursive: false });
  return destination;
}

function appPageSource() {
  return `import type { Metadata } from "next";
import type { ClientRuntimePayload } from "@/features/exports/client-runtime/contracts";
import payload from "@/client-runtime-payload.json";
import { ClientRuntimeRenderer } from "@/features/exports/client-runtime/renderer";
import { clientRuntimeTemplateEntry } from "@/${"ENTRYPOINT"}";
import { saveCookieConsent, submitLead } from "./actions";
import { getPublicSite } from "@/client-runtime/site";

const clientPayload = payload as ClientRuntimePayload;

export function generateMetadata(): Metadata {
  const seo = clientPayload.page.seo;
  return {
    title: seo?.metaTitle || clientPayload.page.title,
    description: seo?.metaDescription || undefined,
    keywords: seo?.keywords?.split(",").map((keyword) => keyword.trim()).filter(Boolean),
    robots: { index: seo?.robotsIndex ?? true, follow: seo?.robotsFollow ?? true },
    openGraph: {
      title: seo?.ogTitle || seo?.metaTitle || clientPayload.page.title,
      description: seo?.ogDescription || seo?.metaDescription || undefined,
      type: "website",
    },
  };
}

export default function LandingPage() {
  return <ClientRuntimeRenderer
    payload={clientPayload}
    templateEntry={clientRuntimeTemplateEntry}
    site={getPublicSite(clientPayload)}
    legalSettings={{
      privacyPage: { slug: "politica-privacidade", title: "Política de Privacidade" },
      cookiePage: { slug: "politica-cookies", title: "Política de Cookies" },
      termsPage: { slug: "termos-condicoes", title: "Termos e Condições" },
      analyticsCookiesEnabled: false,
      cookieBannerEnabled: true,
      marketingCookiesEnabled: false,
      consentVersion: "1",
    }}
    saveConsentAction={saveCookieConsent}
    submitFormAction={submitLead}
    turnstileEnabled={Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)}
    turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null}
  />;
}
`;
}

function actionsSource() {
  return `"use server";

import type { ClientRuntimePayload } from "@/features/exports/client-runtime/contracts";
import { cookies } from "next/headers";
import payload from "@/client-runtime-payload.json";

const clientPayload = payload as ClientRuntimePayload;

const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\\\"": "&quot;", "'": "&#39;",
}[character] ?? character));

export async function saveCookieConsent(formData: FormData) {
  const version = String(formData.get("version") || "").slice(0, 40);
  if (!version) return;
  const store = await cookies();
  store.set("client-cookie-consent", JSON.stringify({
    version,
    analytics: formData.get("analytics") === "on",
    marketing: formData.get("marketing") === "on",
  }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 180 });
}

export async function submitLead(formData: FormData) {
  if (String(formData.get("companyWebsite") || "").trim()) {
    return { ok: true, fieldErrors: {}, formError: null };
  }
  const formKey = String(formData.get("formId") || "");
  const form = clientPayload.page.forms.find((candidate) => candidate.key === formKey);
  if (!form) return { ok: false, fieldErrors: {}, formError: "Não foi possível validar o formulário." };
  const fieldErrors: Record<string, string> = {};
  const values: Array<[string, string]> = [];
  for (const field of form.fields) {
    const raw = formData.getAll(field.name).filter((value): value is string => typeof value === "string");
    const value = raw.join(", ").trim().slice(0, 4000);
    if (field.isRequired && !value) fieldErrors[field.name] = "Este campo é obrigatório.";
    if (field.type === "EMAIL" && value && !emailPattern.test(value)) fieldErrors[field.name] = "Introduz um endereço de email válido.";
    if (value) values.push([field.label.slice(0, 120), value]);
  }
  if (form.gdprConsentRequired !== false && formData.get("gdprConsent") !== "yes") fieldErrors.gdprConsent = "Aceita a Política de Privacidade para enviar.";
  if (form.gdprConsentRequired !== false && String(formData.get("gdprConsentVersion") || "") !== (form.gdprConsentVersion || "1.0")) {
    fieldErrors.gdprConsent = "Atualiza a página e confirma a versão atual da Política de Privacidade.";
  }
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors, formError: "Verifica os campos assinalados." };

  const turnstileToken = String(formData.get("cf-turnstile-response") || "");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (Boolean(turnstileSiteKey) !== Boolean(turnstileSecret)) {
    return { ok: false, fieldErrors: {}, formError: "A verificação anti-spam está configurada de forma incompleta." };
  }
  if (turnstileSecret) {
    if (!turnstileToken) return { ok: false, fieldErrors: { turnstile: "Conclui a verificação anti-spam." }, formError: "Verifica o desafio anti-spam." };
    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: turnstileSecret, response: turnstileToken }),
      signal: AbortSignal.timeout(5000),
    }).then((response) => response.json() as Promise<{ success?: boolean }>).catch(() => ({ success: false }));
    if (!verification.success) return { ok: false, fieldErrors: { turnstile: "A verificação expirou. Tenta novamente." }, formError: "Verifica o desafio anti-spam." };
  }
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.LEAD_NOTIFICATION_EMAIL;
  const sender = process.env.EMAIL_FROM;
  if (!apiKey || !recipient || !sender) return { ok: false, fieldErrors: {}, formError: "O envio ainda não está configurado. Contacta a equipa do site." };
  const html = values.map(([label, value]) => "<p><strong>" + escapeHtml(label) + ":</strong> " + escapeHtml(value) + "</p>").join("");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: "Bearer " + apiKey, "content-type": "application/json" },
    body: JSON.stringify({ from: sender, to: [recipient], subject: "Novo contacto: " + form.name.slice(0, 120), html }),
    signal: AbortSignal.timeout(8000),
  }).then((result) => result.ok).catch(() => false);
  return response
    ? { ok: true, fieldErrors: {}, formError: null }
    : { ok: false, fieldErrors: {}, formError: "Não foi possível enviar agora. Tenta novamente mais tarde." };
}
`;
}

function siteSource() {
  return `import type { ClientRuntimePayload } from "@/features/exports/client-runtime/contracts";
type RuntimePayload = ClientRuntimePayload;
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const text = (value: unknown) => typeof value === "string" ? value : "";

export function getPublicSite(payload: RuntimePayload) {
  const brand = payload.page.sections.map((section) => record(section.content)).find((content) => content.brandName || content.logoText) ?? {};
  const contact = payload.page.sections.filter((section) => section.sectionType === "contact").map((section) => record(section.content))[0] ?? {};
  return {
    businessName: text(brand.brandName) || text(brand.logoText) || payload.page.title,
    businessType: null,
    contactEmail: text(contact.email),
    contactPhone: text(contact.phone) || null,
    city: text(contact.city) || null,
    country: text(contact.country) || "Portugal",
    primaryColor: payload.page.theme.primaryColor,
    secondaryColor: payload.page.theme.secondaryColor,
    accentColor: payload.page.theme.accentColor,
    logoMedia: brand.logoUrl ? { publicUrl: text(brand.logoUrl), altText: text(brand.logoAltText) || payload.page.title } : null,
  };
}
`;
}

function legalPageSource(title: string) {
  return `export const metadata = { title: ${JSON.stringify(title)}, robots: { index: false, follow: false } };
export default function LegalNotice() {
  return <main className="mx-auto max-w-3xl px-6 py-20"><h1 className="text-3xl font-semibold">${title}</h1><p className="mt-4">Esta página tem de ser preenchida com a informação legal do responsável pelo site antes da publicação.</p></main>;
}
`;
}

function clientRuntimePath(sourcePath: string) {
  if (!sourcePath.startsWith("src/")) throw new Error("A fonte do runtime cliente tem de estar dentro de src/.");
  return `src/client-runtime/${sourcePath.slice(4)}`;
}

export function clientRuntimeSource(source: string) {
  return source
    .replaceAll("@/features/", "@/client-runtime/features/")
    .replaceAll("@/components/", "@/client-runtime/components/")
    .replaceAll("@/lib/utils", "@/client-runtime/lib/utils");
}

export function listClientRuntimeMaintenanceSources(templateKey: string, variantKey: string) {
  const graph = collectClientRuntimeSourceGraph(templateKey, variantKey);
  return graph.files
    .filter((sourcePath) => isTemplateScopedRuntimeSourcePath(sourcePath, templateKey, variantKey))
    .map((sourcePath) => ({
      sourcePath,
      packagePath: clientRuntimePath(sourcePath),
      content: clientRuntimeSource(readFileSync(resolve(projectRoot, sourcePath), "utf8")),
    }));
}

function clientDocumentation(composition: ClientRuntimeComposition) {
  return {
    "client-docs/DEPLOYMENT.md": "# Publicar a landing\n\n## Vercel\n1. Cria um projeto Vercel a partir desta pasta/arquivo e usa a raiz do projeto.\n2. Configura as variáveis de ambiente indicadas em `.env.example`.\n3. Define `NEXT_PUBLIC_SITE_URL` com o domínio final.\n4. Executa o build de produção e valida o domínio, HTTPS, formulário e consentimento antes de anunciar a publicação.\n\nA exportação não cria projetos, domínios, DNS ou deployments automaticamente. A configuração na Vercel/DNS é manual. Não coloques segredos em ficheiros versionados.\n",
    "client-docs/FORMULARIOS-E-CONFIGURACAO.md": "# Formulários e configuração\n\nO envio de leads requer configuração de email do cliente: `RESEND_API_KEY`, `LEAD_NOTIFICATION_EMAIL` e `EMAIL_FROM`. A chave e o remetente devem pertencer ao cliente e o domínio do remetente deve estar verificado no fornecedor.\n\nTurnstile é opcional; se for ativado, configura em conjunto `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`. Nunca publiques a chave secreta.\n\nTesta um envio real e confirma que o pedido chega ao destinatário. O pacote não inclui credenciais LandingForge.\n",
    "client-docs/ANTES-DE-PUBLICAR.md": "# Antes de publicar\n\n- Revê e substitui os avisos das páginas de privacidade, cookies e termos por conteúdo aprovado para o negócio e a jurisdição aplicável. O conteúdo gerado não é aconselhamento jurídico.\n- Confirma direitos de utilização das imagens e restantes assets.\n- Configura email e, se aplicável, Turnstile com credenciais do cliente.\n- Confirma domínio, HTTPS, SEO, formulário, consentimento e visualização mobile.\n- Esta entrega é Landing Only: não contém CMS, autenticação, dashboard ou administração.\n",
    "client-docs/ATUALIZACAO-DE-MANUTENCAO.md": "# Atualização com manutenção\n\nEste é um pacote integral de atualização validado. Confirma o Project, a versão e o checksum SHA-256 no manifesto em `deployment/client-runtime-project-manifest.json`.\n\n1. Faz backup do código, configuração e dados operacionais atualmente publicados.\n2. Confirma que o destino corresponde ao Project e à release indicados no manifesto.\n3. Compara a versão instalada com esta entrega e preserva os ficheiros específicos do alojamento. Nunca substituas `.env`, credenciais, dados ou configuração do cliente.\n4. Instala dependências e executa `npm run typecheck` e `npm run build` em staging.\n5. Publica pelo processo do fornecedor e verifica página, domínio, HTTPS e formulário.\n6. Mantém o artefacto anterior até terminar a verificação pós-publicação. Em caso de falha, repõe o artefacto anterior sem restaurar conteúdo operacional desatualizado.\n\nO pacote não publica remotamente, não contém credenciais e não faz merge automático de código personalizado. Se existirem alterações externas, reconcilia-as antes de substituir ficheiros.\n",
    ...buildClientDeliveryDocumentation(composition),
  };
}

export function assembleClientRuntimeProject(
  composition: ClientRuntimeComposition,
  destinationRoot: string,
  sourceOverrides: Record<string, string> = {},
) {
  const destination = ensureTemporaryDestination(destinationRoot);
  try {
    const sourceManifest = assembleClientRuntimeSourceFiles(
      composition.template.key,
      composition.template.variantKey,
      resolve(destination, "source-copy"),
    );
    const packagedSourceFiles: string[] = [];
    const allowedOverridePaths = new Set(sourceManifest.files.map(clientRuntimePath));
    for (const [path, content] of Object.entries(sourceOverrides)) {
      if (!allowedOverridePaths.has(path) || !isTemplateScopedRuntimeSourcePath(
        `src/${path.slice("src/client-runtime/".length)}`,
        composition.template.key,
        composition.template.variantKey,
      )) throw new Error("A candidata contém uma alteração de código fora da allowlist da variante.");
      if (typeof content !== "string" || Buffer.byteLength(content, "utf8") > 100_000) {
        throw new Error("Uma alteração de código excede o limite permitido.");
      }
    }
    if (Object.keys(sourceOverrides).length > 12 || Object.values(sourceOverrides).reduce((sum, content) => sum + Buffer.byteLength(content, "utf8"), 0) > 300_000) {
      throw new Error("As alterações de código excedem os limites permitidos para uma release.");
    }
    for (const source of sourceManifest.files) {
      const destinationPath = clientRuntimePath(source);
      const copied = resolve(destination, destinationPath);
      const from = resolve(destination, "source-copy", source);
      mkdirSync(dirname(copied), { recursive: true });
      const raw = readFileSync(from);
      const content = sourceOverrides[destinationPath] ?? (/\.[jt]sx?$/.test(source) ? clientRuntimeSource(raw.toString("utf8")) : raw);
      writeFileSync(copied, content, { flag: "wx" });
      packagedSourceFiles.push(destinationPath);
    }
    rmSync(resolve(destination, "source-copy"), { recursive: true, force: true });

    const entrypoint = `client-runtime/${composition.template.entrypoint
      .replace(/^src\//, "")
      .replace(/\.tsx$/, "")}`;
    const files: Record<string, string> = {
      "app/page.tsx": clientRuntimeSource(appPageSource().replace("ENTRYPOINT", entrypoint)),
      "app/layout.tsx": `import type { Metadata } from "next";\nimport "./globals.css";\nexport const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.invalid") };\nexport default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-PT"><body>{children}</body></html>; }\n`,
      "app/globals.css": `@import "tailwindcss";\n@source "../src/**/*.{ts,tsx}";\n`,
      "app/actions.ts": clientRuntimeSource(actionsSource()),
      "app/politica-privacidade/page.tsx": legalPageSource("Política de Privacidade"),
      "app/politica-cookies/page.tsx": legalPageSource("Política de Cookies"),
      "app/termos-condicoes/page.tsx": legalPageSource("Termos e Condições"),
      "src/client-runtime/site.ts": clientRuntimeSource(siteSource()),
      "src/client-runtime-payload.json": `${JSON.stringify(composition.payload, null, 2)}\n`,
      "package.json": `${JSON.stringify({
        name: "landingforge-client-landing",
        version: "1.0.0",
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start", typecheck: "tsc --noEmit" },
        dependencies: {
          next: lockedVersion("next"),
          react: lockedVersion("react"),
          "react-dom": lockedVersion("react-dom"),
          ...Object.fromEntries(composition.template.dependencies.filter((name) => rootPackage.dependencies[name]).map((name) => [name, lockedVersion(name)])),
        },
        devDependencies: {
          "@tailwindcss/postcss": lockedVersion("@tailwindcss/postcss"),
          tailwindcss: lockedVersion("tailwindcss"),
          typescript: lockedVersion("typescript"),
          "@types/node": lockedVersion("@types/node"),
          "@types/react": lockedVersion("@types/react"),
          "@types/react-dom": lockedVersion("@types/react-dom"),
        },
      }, null, 2)}\n`,
      "next.config.ts": `import type { NextConfig } from "next";\nconst config: NextConfig = { images: { unoptimized: true } };\nexport default config;\n`,
      "postcss.config.mjs": `export default { plugins: { "@tailwindcss/postcss": {} } };\n`,
      "tsconfig.json": `${JSON.stringify({ compilerOptions: { target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] } }, include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"] }, null, 2)}\n`,
      ".env.example": `NEXT_PUBLIC_SITE_URL=https://example.com\nRESEND_API_KEY=\nLEAD_NOTIFICATION_EMAIL=\nEMAIL_FROM=\nNEXT_PUBLIC_TURNSTILE_SITE_KEY=\nTURNSTILE_SECRET_KEY=\n`,
      "deployment/client-runtime-project-manifest.json": `${JSON.stringify({
        format: "landingforge-client-runtime-project",
        formatVersion: 1,
        mode: composition.mode,
        template: composition.template,
        payloadFile: "src/client-runtime-payload.json",
        sourceFiles: packagedSourceFiles,
        generatedFiles: ["app/page.tsx", "app/layout.tsx", "app/actions.ts", "src/client-runtime/site.ts"],
        credentialsCopied: false,
        maintenanceRelease: composition.maintenanceRelease ?? null,
        buildVerified: false,
      }, null, 2)}\n`,
    };
    for (const [relativePath, content] of Object.entries(files)) {
      const output = resolve(destination, relativePath);
      if (!output.startsWith(`${destination}${sep}`)) throw new Error("O ficheiro gerado excede a raiz temporária permitida.");
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, content, { encoding: "utf8", flag: "wx" });
    }
    const deliveryDocs = clientDocumentation(composition);
    for (const [relativePath, content] of Object.entries(deliveryDocs)) {
      const output = resolve(destination, relativePath);
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, content, { encoding: "utf8", flag: "wx" });
    }
    return { destination, files: [...Object.keys(files), ...Object.keys(deliveryDocs), ...packagedSourceFiles].sort(), sourceManifest };
  } catch (error) {
    rmSync(destination, { recursive: true, force: true });
    throw error;
  }
}
