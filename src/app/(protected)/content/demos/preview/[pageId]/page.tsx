import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPageRenderer } from "@/features/public-renderer/components/public-page-renderer";
import { getDemoPreviewPageById } from "@/features/public-renderer/services/public-page.service";
import {
  assertCanManageDemos,
  InternalDemosUnavailableError,
} from "@/features/content/services/demo.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

const viewportClasses = {
  desktop: "max-w-7xl",
  tablet: "max-w-3xl",
  mobile: "max-w-sm",
} as const;

export default async function DemoPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ pageId: string }>;
  searchParams: Promise<{ viewport?: keyof typeof viewportClasses }>;
}) {
  const user = await requirePermission(permissions.cmsRead);
  try {
    assertCanManageDemos(user.roles);
  } catch (error) {
    if (!(error instanceof InternalDemosUnavailableError)) throw error;

    return (
      <main className="mx-auto grid min-h-[60vh] max-w-2xl content-center gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">Pré-visualização indisponível</h1>
        <p className="text-muted-foreground" role="status">
          As demos internas não estão disponíveis neste ambiente. Podes voltar à gestão de conteúdo.
        </p>
        <Link className="text-primary underline underline-offset-4" href="/content">
          Voltar à gestão de conteúdo
        </Link>
      </main>
    );
  }
  const { pageId } = await params;
  const { viewport = "desktop" } = await searchParams;
  const context = await getDemoPreviewPageById(pageId);
  if (!context) notFound();

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {Object.keys(viewportClasses).map((mode) => (
          <a className="rounded-md border bg-white px-3 py-2 font-medium" href={`?viewport=${mode}`} key={mode}>
            {mode}
          </a>
        ))}
      </div>
      <div className={`mx-auto overflow-hidden rounded-md bg-white shadow ${viewportClasses[viewport] ?? viewportClasses.desktop}`}>
        <PublicPageRenderer context={context} />
      </div>
    </main>
  );
}
