import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import ts from "typescript";

import { getClientRuntimeTemplateProfile } from "@/features/exports/services/client-runtime-catalog";

const projectRoot = process.cwd();
const tsconfigPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, "tsconfig.json");
if (!tsconfigPath) throw new Error("Não foi encontrado tsconfig.json para resolver o runtime cliente.");

const tsconfig = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
if (tsconfig.error) throw new Error("Não foi possível ler tsconfig.json.");
const compilerOptions = ts.parseJsonConfigFileContent(tsconfig.config, ts.sys, dirname(tsconfigPath)).options;

const allowedSourceRoots = [
  "src/features/exports/client-runtime",
  "src/features/exports/services/client-runtime-payload.ts",
  "src/features/public-renderer",
  "src/features/legal/components/cookie-consent-banner.tsx",
  "src/components/ui",
  "src/lib/utils.ts",
];
const forbiddenImportPattern =
  /(?:@\/generated\/prisma|@\/lib\/(?:db|auth)|@\/features\/(?:clients|projects|crm|forms\/(?:actions|services)|legal\/(?:actions|schemas|services)|exports\/(?!client-runtime(?:\/|$)|services\/client-runtime-payload)))(?:\/|["'])/;

function projectRelative(filePath: string) {
  return resolve(filePath).slice(projectRoot.length + 1).replaceAll("\\", "/");
}

function isAllowedSource(filePath: string) {
  const relative = projectRelative(filePath);
  return allowedSourceRoots.some((root) => relative === root || relative.startsWith(`${root}/`));
}

export function isTemplateScopedRuntimeSourcePath(path: string, templateKey: string, variantKey: string) {
  const templatePrefix = `src/features/public-renderer/templates/${templateKey}/`;
  const variantEntrypoint = `src/features/exports/client-runtime/entrypoints/${templateKey}/${variantKey}.tsx`;
  const sectionRegistry = `src/features/public-renderer/section-registry/${templateKey}.ts`;
  return path === variantEntrypoint || path === sectionRegistry ||
    (path.startsWith(templatePrefix) && /\.(?:tsx?|css)$/.test(path));
}

function resolveImport(importPath: string, containingFile: string): string | null {
  const resolution = ts.resolveModuleName(importPath, containingFile, compilerOptions, ts.sys).resolvedModule;
  if (resolution) return resolve(resolution.resolvedFileName);
  if (!importPath.startsWith(".") && !importPath.startsWith("@/")) return null;

  const base = importPath.startsWith("@/")
    ? resolve(projectRoot, "src", importPath.slice(2))
    : resolve(dirname(containingFile), importPath);
  const candidates = extname(base) ? [base] : [base, `${base}.css`, `${base}.module.css`];
  return candidates.find(existsSync) ?? null;
}

function sourceImports(source: string, filePath: string) {
  const parsed = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  return parsed.statements.flatMap((statement) => {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      return [statement.moduleSpecifier.text];
    }
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      return [statement.moduleSpecifier.text];
    }
    return [];
  });
}

export function collectClientRuntimeSourceGraph(templateKey: string, variantKey: string) {
  const profile = getClientRuntimeTemplateProfile(templateKey, variantKey);
  if (!profile) throw new Error("A combinação de template e variante não tem um runtime cliente aprovado.");

  const queue = [
    resolve(projectRoot, profile.entrypoint),
    resolve(projectRoot, "src/features/exports/client-runtime/renderer.tsx"),
  ];
  const visited = new Set<string>();
  const violations: string[] = [];
  const dependencies = new Set<string>();
  while (queue.length) {
    const current = queue.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (projectRelative(current).startsWith("node_modules/")) continue;
    if (!isAllowedSource(current)) {
      violations.push(`${projectRelative(current)} (fora da allowlist)`);
      continue;
    }
    if (!/\.[jt]sx?$/.test(extname(current))) continue;

    const source = readFileSync(current, "utf8");
    if (forbiddenImportPattern.test(source)) {
      violations.push(`${projectRelative(current)} (import privado do Master)`);
      continue;
    }
    for (const importPath of sourceImports(source, current)) {
      const dependency = resolveImport(importPath, current);
      if (dependency && projectRelative(dependency).startsWith("node_modules/")) {
        const packageName = importPath.startsWith("@/") || importPath.startsWith(".")
          ? null
          : importPath.startsWith("@")
            ? importPath.split("/").slice(0, 2).join("/")
            : importPath.split("/")[0];
        if (packageName) dependencies.add(packageName);
      } else if (dependency) queue.push(dependency);
      else if (importPath.startsWith(".") || importPath.startsWith("@/")) {
        violations.push(`${projectRelative(current)} -> ${importPath} (dependência não resolvida)`);
      }
    }
  }

  if (violations.length) {
    throw new Error(`O grafo de fontes do runtime excede a allowlist: ${violations.join(", ")}`);
  }
  return {
    files: [...visited].filter((file) => !projectRelative(file).startsWith("node_modules/")).map(projectRelative).sort(),
    dependencies: [...dependencies].sort(),
  };
}
