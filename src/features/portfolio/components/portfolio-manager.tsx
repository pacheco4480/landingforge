import Link from "next/link";

import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import {
  archivePortfolioScreenshotAction,
  createPortfolioScreenshotAction,
  updatePortfolioScreenshotVisibilityAction,
  updatePortfolioVisibilityAction,
} from "@/features/portfolio/actions/portfolio.actions";
import type { getPortfolioManagement } from "@/features/portfolio/services/portfolio.service";

type Workspace = Awaited<ReturnType<typeof getPortfolioManagement>>;

export function PortfolioManager({ workspace }: { workspace: Workspace }) {
  return (
    <div className="grid gap-8">
      <CmsPageHeader
        eyebrow="Área comercial"
        title="Portfolio"
        description="Publica demos aprovadas e gere as capturas associadas. Para aparecer publicamente, cada demo tem de estar publicada, usar uma variante ativa e ter imagem social pública configurada."
      />
      <div className="flex flex-wrap gap-3">
        <Link className="inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted" href="/portfolio" target="_blank">Abrir portfolio público</Link>
        <Link className="inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted" href="/content">Gerir estado e conteúdo das demos</Link>
        <Link className="inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted" href="/forms">Configurar formulário de contacto</Link>
        <p className="text-muted-foreground self-center text-sm">A chave do formulário global deve ser <code>landingforge-portfolio</code>.</p>
      </div>
      {workspace.items.length === 0 ? (
        <p className="rounded-md border p-6 text-sm">Ainda não existem demos internas.</p>
      ) : workspace.items.map((item) => (
        <section className="grid gap-5 rounded-md border p-5" key={item.id}>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs">{item.template?.industry.name ?? "Sem indústria"} · {item.template?.name ?? "Sem template"} · {item.templateVariant?.name ?? "Sem variante"}</p>
              <h2 className="mt-1 text-xl font-semibold">{item.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">/{item.slug} · {item.status} / {item.demoStatus}</p>
              <p className="text-muted-foreground mt-1 text-sm">Imagem social: {item.seoSetting?.ogImageMedia?.publicUrl && !item.seoSetting.ogImageMedia.deletedAt ? "configurada" : "em falta"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted" href={`/seo?pageId=${item.id}`}>Configurar imagem social</Link>
              <Link className="inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted" href={`/content/demos/preview/${item.id}`} target="_blank">Pré-visualizar</Link>
            </div>
          </header>
          <ActionFeedbackForm action={updatePortfolioVisibilityAction} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end" successMessage="Visibilidade do portfolio atualizada.">
            <input name="pageId" type="hidden" value={item.id} />
            <input name="slug" type="hidden" value={item.slug} />
            <label className="grid gap-1 text-sm font-medium" htmlFor={`portfolio-order-${item.id}`}>Ordem no portfolio
              <input className="h-10 rounded-md border bg-background px-3" defaultValue={item.portfolioOrder ?? ""} id={`portfolio-order-${item.id}`} min="0" name="sortOrder" type="number" />
            </label>
            <label className="flex min-h-10 items-center gap-2 text-sm">
              <input defaultChecked={item.portfolioVisible} name="isPublic" type="checkbox" />
              Visível publicamente
            </label>
            <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit">Guardar</button>
          </ActionFeedbackForm>
          <div className="grid gap-4 border-t pt-5">
            <div>
              <h3 className="font-semibold">Capturas</h3>
              <p className="text-muted-foreground mt-1 text-sm">Usa imagens da Media Library para capturas públicas. Imagens de CMS/Dashboard são carregadas apenas para armazenamento privado.</p>
            </div>
            {item.portfolioScreenshots.length ? (
              <ul className="grid gap-3 md:grid-cols-2">
                {item.portfolioScreenshots.map((shot) => (
                  <li className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3" key={shot.id}>
                    <div className="min-w-0">
                      <p className="font-medium">{shot.category} · {shot.viewport}</p>
                      <p className="text-muted-foreground truncate text-xs">{shot.altText} · {shot.isPublic ? "Pública" : "Interna"}</p>
                      {shot.privateStoragePath ? <a className="mt-1 inline-block text-sm underline" href={`/api/portfolio/screenshots/${shot.id}`} rel="noreferrer" target="_blank">Abrir captura interna</a> : null}
                    </div>
                    <div className="flex gap-2">
                      <ActionFeedbackForm action={updatePortfolioScreenshotVisibilityAction} successMessage="Visibilidade da captura atualizada.">
                        <input name="id" type="hidden" value={shot.id} />
                        {!shot.isPublic ? <input name="isPublic" type="hidden" value="true" /> : null}
                        <button className="rounded-md border px-3 py-1.5 text-sm" type="submit">{shot.isPublic ? "Ocultar" : "Publicar"}</button>
                      </ActionFeedbackForm>
                      <ActionFeedbackForm action={archivePortfolioScreenshotAction} successMessage="Captura arquivada.">
                        <input name="id" type="hidden" value={shot.id} />
                        <button className="rounded-md px-3 py-1.5 text-sm hover:bg-muted" type="submit">Arquivar</button>
                      </ActionFeedbackForm>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground text-sm">Sem capturas registadas.</p>}
            <div className="grid gap-5 lg:grid-cols-2">
              <ScreenshotForm itemId={item.id} slug={item.slug} assets={workspace.assets} kind="public" />
              <ScreenshotForm itemId={item.id} slug={item.slug} assets={workspace.assets} kind="internal" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function ScreenshotForm({ itemId, slug, assets, kind }: {
  itemId: string;
  slug: string;
  assets: Workspace["assets"];
  kind: "public" | "internal";
}) {
  const internal = kind === "internal";
  return (
    <ActionFeedbackForm action={createPortfolioScreenshotAction} className="grid gap-3 rounded-md bg-muted/40 p-4" loadingMessage="A guardar captura..." successMessage="Captura registada.">
      <input name="pageId" type="hidden" value={itemId} />
      <input name="slug" type="hidden" value={slug} />
      <h4 className="font-medium">{internal ? "Registar captura interna" : "Registar captura pública"}</h4>
      {internal ? <>
        <label className="grid gap-1 text-sm">Imagem
          <input accept="image/jpeg,image/png,image/webp" className="rounded-md border bg-background p-2" name="file" required type="file" />
        </label>
        <label className="grid gap-1 text-sm">Categoria
          <select className="h-10 rounded-md border bg-background px-3" name="category"><option value="cms">CMS</option><option value="dashboard">Dashboard</option></select>
        </label>
        <label className="grid gap-1 text-sm">Viewport
          <select className="h-10 rounded-md border bg-background px-3" name="viewport"><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option><option value="cms">CMS</option></select>
        </label>
      </> : <>
        <label className="grid gap-1 text-sm">Imagem da Media Library
          <select className="h-10 rounded-md border bg-background px-3" name="mediaAssetId" required defaultValue="">
            <option disabled value="">Selecionar imagem</option>
            {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.filename}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">Categoria
          <select className="h-10 rounded-md border bg-background px-3" name="category"><option value="hero">Hero</option><option value="section">Secção</option><option value="form">Formulário</option></select>
        </label>
        <label className="grid gap-1 text-sm">Viewport
          <select className="h-10 rounded-md border bg-background px-3" name="viewport"><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select>
        </label>
      </>}
      <input name="sourceRoute" type="hidden" value={`/${slug}`} />
      <label className="grid gap-1 text-sm">Texto alternativo
        <input className="h-10 rounded-md border bg-background px-3" maxLength={240} minLength={5} name="altText" required />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">Consentimento de cookies
          <select className="h-10 rounded-md border bg-background px-3" name="consentState"><option value="not-applicable">Não aplicável</option><option value="accepted">Aceite</option><option value="rejected">Recusado</option></select>
        </label>
        <label className="grid gap-1 text-sm">Origem do conteúdo
          <select className="h-10 rounded-md border bg-background px-3" name="contentOrigin"><option value="fictional-demo">Demo fictícia</option><option value="client-approved">Aprovado pelo cliente</option><option value="other">Outro</option></select>
        </label>
      </div>
      <label className="flex min-h-10 items-center gap-2 text-sm"><input disabled={internal} name="isPublic" type="checkbox" /> Publicar captura</label>
      <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit">Registar captura</button>
    </ActionFeedbackForm>
  );
}
