import { redirectSchema } from "@/features/seo/schemas/redirect.schema";
import { db } from "@/lib/db";

export async function upsertRedirect(input: unknown, userId: string) {
  const data = redirectSchema.parse(input);
  await assertNoRedirectLoop(data.fromPath, data.toPath, data.id);
  const existing = data.id
    ? await db.redirect.findUnique({ where: { id: data.id } })
    : await db.redirect.findUnique({ where: { fromPath: data.fromPath } });

  const redirect = data.id
    ? await db.redirect.update({
        where: { id: data.id },
        data: {
          fromPath: data.fromPath,
          toPath: data.toPath,
          statusCode: data.statusCode,
        },
      })
    : await db.redirect.create({
        data: {
          fromPath: data.fromPath,
          toPath: data.toPath,
          statusCode: data.statusCode,
        },
      });

  await db.auditLog.create({
    data: {
      userId,
      action: existing ? "redirect.update" : "redirect.create",
      entityType: "redirect",
      entityId: redirect.id,
      oldValues: existing
        ? { fromPath: existing.fromPath, toPath: existing.toPath }
        : undefined,
      newValues: {
        fromPath: redirect.fromPath,
        toPath: redirect.toPath,
        statusCode: redirect.statusCode,
      },
    },
  });

  return redirect;
}

async function assertNoRedirectLoop(
  fromPath: string,
  toPath: string,
  ignoreId?: string,
) {
  const redirects = await db.redirect.findMany({
    where: ignoreId ? { NOT: { id: ignoreId } } : undefined,
    select: { fromPath: true, toPath: true },
  });
  if (hasRedirectLoop(redirects, fromPath, toPath)) {
    throw new Error("Redirect loop detected.");
  }
}

export function hasRedirectLoop(
  redirects: Array<{ fromPath: string; toPath: string }>,
  fromPath: string,
  toPath: string,
) {
  const redirectMap = new Map(
    redirects.map((item) => [item.fromPath, item.toPath]),
  );
  redirectMap.set(fromPath, toPath);

  const visited = new Set<string>();
  let current = toPath;

  while (redirectMap.has(current)) {
    if (current === fromPath || visited.has(current)) return true;
    visited.add(current);
    current = redirectMap.get(current)!;
  }

  return false;
}

export async function deleteRedirect(id: string, userId: string) {
  const redirect = await db.redirect.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      userId,
      action: "redirect.delete",
      entityType: "redirect",
      entityId: id,
      oldValues: {
        fromPath: redirect.fromPath,
        toPath: redirect.toPath,
        statusCode: redirect.statusCode,
      },
    },
  });
}
