import { copyFileSync, existsSync, lstatSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";

import { collectClientRuntimeSourceGraph } from "@/features/exports/services/client-runtime-source-graph";

const projectRoot = realpathSync(process.cwd());

export function assembleClientRuntimeSourceFiles(
  templateKey: string,
  variantKey: string,
  destinationRoot: string,
) {
  const destination = resolve(destinationRoot);
  const temporaryRoot = realpathSync(tmpdir());
  const parent = realpathSync(dirname(destination));
  const parentRelative = relative(temporaryRoot, parent);
  if (!parentRelative || parentRelative === ".." || parentRelative.startsWith(`..${sep}`) || isAbsolute(parentRelative)) {
    throw new Error("O runtime só pode ser materializado num diretório temporário dedicado.");
  }
  if (existsSync(destination)) {
    throw new Error("O destino do runtime já existe; a montagem não substitui conteúdo existente.");
  }

  const graph = collectClientRuntimeSourceGraph(templateKey, variantKey);
  mkdirSync(destination, { recursive: false });
  const copiedFiles: string[] = [];

  try {
    for (const sourceRelative of graph.files) {
      const sourcePath = resolve(projectRoot, sourceRelative);
      const sourceWithinProject = relative(projectRoot, sourcePath);
      if (sourceWithinProject === ".." || sourceWithinProject.startsWith(`..${sep}`) || isAbsolute(sourceWithinProject)) {
        throw new Error("A fonte resolvida excede a raiz do projeto.");
      }
      if (lstatSync(sourcePath).isSymbolicLink()) {
        throw new Error(`A fonte ${sourceRelative} é um symlink e não pode ser copiada.`);
      }

      const outputPath = resolve(destination, sourceRelative);
      const outputRelative = relative(destination, outputPath);
      if (outputRelative === ".." || outputRelative.startsWith(`..${sep}`) || isAbsolute(outputRelative)) {
        throw new Error("O destino da fonte excede a raiz temporária do runtime.");
      }
      mkdirSync(dirname(outputPath), { recursive: true });
      copyFileSync(sourcePath, outputPath);
      copiedFiles.push(sourceRelative);
    }

    const manifest = {
      format: "landingforge-client-runtime-source-plan",
      formatVersion: 1,
      mode: "LANDING_ONLY",
      template: { key: templateKey, variantKey },
      files: copiedFiles.sort(),
      dependencies: graph.dependencies,
    };
    writeFileSync(resolve(destination, "client-runtime-source-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });

    return manifest;
  } catch (error) {
    rmSync(destination, { recursive: true, force: true });
    throw error;
  }
}
