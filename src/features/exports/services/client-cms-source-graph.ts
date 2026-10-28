import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

import ts from "typescript";

import { collectClientRuntimeSourceGraph } from "@/features/exports/services/client-runtime-source-graph";

const root = resolve(process.cwd());
const approvedCmsRoot = "src/features/exports/client-runtime/cms";
const approvedDependencies = ["@supabase/supabase-js", "argon2", "next-auth", "pg", "server-only", "zod"];

function collectFiles(directory: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(resolve(root, directory), { withFileTypes: true })) {
    const relative = `${directory}/${entry.name}`;
    const absolute = resolve(root, relative);
    if (entry.isSymbolicLink() || lstatSync(absolute).isSymbolicLink()) {
      throw new Error(`A fonte CMS ${relative} é um symlink e não pode ser exportada.`);
    }
    if (entry.isDirectory()) result.push(...collectFiles(relative));
    else if (entry.isFile()) result.push(relative);
  }
  return result;
}

export function collectClientCmsSourceGraph(templateKey: string, variantKey: string) {
  const landingGraph = collectClientRuntimeSourceGraph(templateKey, variantKey);
  const cmsFiles = [...collectFiles(approvedCmsRoot), "src/types/next-auth.d.ts"];
  const files = [...new Set([...landingGraph.files, ...cmsFiles])].sort();
  const packageNames = new Set(landingGraph.dependencies);
  const sourceFiles = files.filter((file) => /\.[jt]sx?$/.test(extname(file)));
  for (const file of sourceFiles) {
    const source = readFileSync(resolve(root, file), "utf8");
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    for (const statement of parsed.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const specifier = statement.moduleSpecifier.text;
      if (specifier.startsWith("node:")) continue;
      if (specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("@/")) {
        if (specifier.startsWith("@/features/exports/client-runtime/cms") && !specifier.startsWith(`@/features/exports/client-runtime/cms/`)) {
          throw new Error(`Import CMS não permitido em ${file}.`);
        }
        continue;
      }
      packageNames.add(specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0]);
    }
  }
  const forbidden = [...packageNames].filter((name) => !approvedDependencies.includes(name) && !landingGraph.dependencies.includes(name));
  if (forbidden.length) throw new Error(`O runtime CMS pediu dependências fora da allowlist: ${forbidden.join(", ")}.`);
  for (const file of cmsFiles) {
    if (!existsSync(resolve(root, file))) throw new Error(`A fonte CMS ${file} não existe.`);
  }
  return { files, dependencies: [...packageNames].sort() };
}
