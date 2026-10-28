import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { execFileSync } from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { isIP } from "node:net";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { request as httpsRequest } from "node:https";

import { zipSync } from "fflate";

import type { ClientRuntimeComposition } from "@/features/exports/services/client-runtime-composition";
import { assembleClientRuntimeProject } from "@/features/exports/services/client-runtime-project-assembler";
import {
  auditClientPackage,
  type ClientPackageAudit,
  type ClientPackageCategory,
  type ClientPackageEntry,
} from "@/features/exports/services/client-package-audit";

const MAX_ASSET_BYTES = 15 * 1024 * 1024;
const MAX_ASSET_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_ASSET_COUNT = 100;
const MAX_TEMPLATE_ASSET_BYTES = 1024 * 1024;
const templateStaticAssetPattern =
  /\/assets\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.(?:svg|jpe?g|png|webp|avif|gif)/g;
const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
  ["image/gif", ".gif"],
]);

function categoryForPath(path: string): ClientPackageCategory {
  if (path.startsWith("cms/")) return "cms";
  if (path.startsWith("auth/")) return "auth";
  if (path.startsWith("database/")) return "database";
  if (path.startsWith("migrations/")) return "migrations";
  if (
    path.startsWith("app/") ||
    path.startsWith("src/client-runtime/") ||
    path === "src/client-runtime-payload.json"
  )
    return "frontend";
  if (path.startsWith("public/")) return "assets";
  if (path.startsWith("seo/")) return "seo";
  if (path.startsWith("forms/")) return "forms";
  if (path.startsWith("client-docs/")) return "client-documentation";
  if (
    path.startsWith("deployment/") ||
    [
      ".env.example",
      "package.json",
      "package-lock.json",
      "next.config.ts",
      "tsconfig.json",
      "postcss.config.mjs",
      "scripts/client-cms-bootstrap.ts",
    ].includes(path)
  )
    return "deployment";
  throw new Error(
    `Ficheiro gerado fora das categorias de entrega permitidas: ${path}`,
  );
}

export function isPublicNetworkAddress(address: string) {
  const family = isIP(address);
  if (family === 4) {
    const octets = address.split(".").map(Number);
    const [a, b] = octets;
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 192 && b === 88 && octets[2] === 99) ||
      (a === 192 && b === 0 && octets[2] === 2) ||
      (a === 198 &&
        (b === 18 || b === 19 || (b === 51 && octets[2] === 100))) ||
      (a === 203 && b === 0 && octets[2] === 113)
    );
  }
  if (family !== 6) return false;
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:"))
    return isPublicNetworkAddress(normalized.slice(7));
  return !(
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:") ||
    normalized.startsWith("2001:10:")
  );
}

async function downloadImage(urlValue: string) {
  const url = new URL(urlValue);
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw new Error(
      "Um asset remoto não usa um endereço HTTPS público permitido.",
    );
  }
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  const address = addresses.find(({ address: candidate }) =>
    isPublicNetworkAddress(candidate),
  );
  if (
    !address ||
    addresses.some(
      ({ address: candidate }) => !isPublicNetworkAddress(candidate),
    )
  ) {
    throw new Error(
      "O domínio de um asset resolve para um endereço de rede não permitido.",
    );
  }

  const result = await new Promise<{ bytes: Buffer; extension: string }>(
    (resolveBytes, reject) => {
      const request = httpsRequest(
        url,
        {
          method: "GET",
          headers: {
            accept: "image/avif,image/webp,image/png,image/jpeg,image/gif",
          },
          lookup: (_hostname, _options, callback) =>
            callback(null, address.address, address.family),
        },
        (response) => {
          if (response.statusCode !== 200) {
            response.resume();
            reject(new Error("Um asset remoto não respondeu com sucesso."));
            return;
          }
          const mime =
            response.headers["content-type"]
              ?.split(";")[0]
              .trim()
              .toLowerCase() ?? "";
          if (!allowedMimeTypes.has(mime)) {
            response.resume();
            reject(
              new Error(
                "Um asset remoto não tem um formato de imagem permitido.",
              ),
            );
            return;
          }
          const extension = allowedMimeTypes.get(mime)!;
          const declaredLength = Number(
            response.headers["content-length"] ?? 0,
          );
          if (declaredLength > MAX_ASSET_BYTES) {
            response.resume();
            reject(
              new Error(
                "Um asset remoto excede o limite de tamanho permitido.",
              ),
            );
            return;
          }
          const chunks: Buffer[] = [];
          let total = 0;
          response.on("data", (chunk: Buffer) => {
            total += chunk.length;
            if (total > MAX_ASSET_BYTES) {
              request.destroy(
                new Error(
                  "Um asset remoto excede o limite de tamanho permitido.",
                ),
              );
              return;
            }
            chunks.push(chunk);
          });
          response.on("end", () =>
            resolveBytes({ bytes: Buffer.concat(chunks), extension }),
          );
          response.on("error", reject);
        },
      );
      request.setTimeout(10_000, () =>
        request.destroy(new Error("Tempo limite ao obter um asset remoto.")),
      );
      request.on("error", reject);
      request.end();
    },
  );
  return result;
}

function localAssetPath(urlValue: string) {
  let decoded: string;
  try {
    decoded = decodeURIComponent(
      new URL(urlValue, "https://landingforge.invalid").pathname,
    );
  } catch {
    throw new Error("O caminho de um asset local não é válido.");
  }
  if (
    !decoded.startsWith("/") ||
    decoded.includes("\\") ||
    decoded.includes("\0") ||
    decoded
      .slice(1)
      .split("/")
      .some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("O caminho de um asset local não é seguro.");
  }
  const root = realpathSync(resolve(process.cwd(), "public"));
  const candidate = resolve(root, `.${decoded}`);
  const resolved = realpathSync(candidate);
  const pathFromRoot = relative(root, resolved);
  if (
    !pathFromRoot ||
    pathFromRoot === ".." ||
    pathFromRoot.startsWith(`..${sep}`) ||
    lstatSync(candidate).isSymbolicLink()
  ) {
    throw new Error(
      "Um asset local aponta para fora da pasta pública permitida.",
    );
  }
  const stats = statSync(resolved);
  if (!stats.isFile() || stats.size > MAX_ASSET_BYTES)
    throw new Error("Um asset local excede os limites permitidos.");
  const extension = extname(resolved).toLowerCase();
  if (![...allowedMimeTypes.values()].includes(extension))
    throw new Error("Um asset local não tem um formato permitido.");
  return { bytes: readFileSync(resolved), extension };
}

export function collectTemplateStaticAssetPaths(
  sourceFiles: readonly { path: string; source: string }[],
  templateKey: string,
) {
  if (!/^[a-z0-9-]+$/.test(templateKey)) return [];
  const prefix = `/assets/${templateKey}/`;
  const paths = new Set<string>();

  for (const file of sourceFiles) {
    for (const match of file.source.matchAll(templateStaticAssetPattern)) {
      if (match[0].startsWith(prefix)) paths.add(match[0]);
    }
  }

  return [...paths].sort();
}

export function packageTemplateStaticAssets(
  paths: readonly string[],
  templateKey: string,
  destination: string,
) {
  if (!paths.length) return;

  const publicRoot = realpathSync(resolve(process.cwd(), "public"));
  const templateAssetRoot = realpathSync(
    resolve(publicRoot, "assets", templateKey),
  );
  const outputRoot = resolve(destination, "public");

  for (const path of paths) {
    const assetRelativePath = path.slice(1);
    const sourcePath = resolve(publicRoot, assetRelativePath);
    const sourceRealPath = realpathSync(sourcePath);
    const sourceWithinTemplate = relative(templateAssetRoot, sourceRealPath);
    const sourceWithinPublic = relative(publicRoot, sourceRealPath);
    const stats = statSync(sourceRealPath);

    if (
      !sourceWithinTemplate ||
      sourceWithinTemplate === ".." ||
      sourceWithinTemplate.startsWith(`..${sep}`) ||
      sourceWithinPublic === ".." ||
      sourceWithinPublic.startsWith(`..${sep}`) ||
      lstatSync(sourcePath).isSymbolicLink() ||
      !stats.isFile() ||
      stats.size > MAX_TEMPLATE_ASSET_BYTES
    ) {
      throw new Error(
        "Um asset estático do template não respeita os limites de exportação.",
      );
    }

    const outputPath = resolve(outputRoot, assetRelativePath);
    const outputRelativePath = relative(outputRoot, outputPath);
    if (
      !outputRelativePath ||
      outputRelativePath === ".." ||
      outputRelativePath.startsWith(`..${sep}`)
    ) {
      throw new Error(
        "Um caminho de asset estático do template não é permitido.",
      );
    }
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, readFileSync(sourceRealPath), { flag: "wx" });
  }
}

function looksLikeImage(value: string) {
  try {
    const url = new URL(value, "https://landingforge.invalid");
    return (
      [...allowedMimeTypes.values()].includes(
        extname(url.pathname).toLowerCase(),
      ) ||
      (url.hostname === "images.unsplash.com" &&
        url.pathname.startsWith("/photo-")) ||
      (url.hostname.endsWith(".supabase.co") &&
        url.pathname.includes("/storage/v1/object/public/"))
    );
  } catch {
    return false;
  }
}

export async function packageClientRuntimeAssets(
  payload: unknown,
  destination: string,
) {
  const cache = new Map<string, string>();
  let totalBytes = 0;
  const assetRoot = resolve(destination, "public/assets");

  async function addAsset(value: string) {
    const cached = cache.get(value);
    if (cached) return cached;
    if (cache.size >= MAX_ASSET_COUNT)
      throw new Error("O pacote excede o limite de assets referenciados.");
    const asset = value.startsWith("/")
      ? localAssetPath(value)
      : await downloadImage(value);
    totalBytes += asset.bytes.length;
    if (totalBytes > MAX_ASSET_TOTAL_BYTES)
      throw new Error("Os assets do pacote excedem o limite total permitido.");
    const checksum = createHash("sha256").update(asset.bytes).digest("hex");
    const path = `/assets/${checksum}${asset.extension}`;
    mkdirSync(assetRoot, { recursive: true });
    writeFileSync(
      resolve(assetRoot, `${checksum}${asset.extension}`),
      asset.bytes,
      { flag: "wx" },
    );
    cache.set(value, path);
    return path;
  }

  async function visit(value: unknown, key = ""): Promise<unknown> {
    if (
      typeof value === "string" &&
      /(?:image|photo|logo|avatar|portrait|gallery|media|background|thumbnail|cover|src)/i.test(
        key,
      )
    ) {
      if (value.startsWith("/") && looksLikeImage(value))
        return addAsset(value);
      if (value.startsWith("https://") && looksLikeImage(value))
        return addAsset(value);
      if (value.startsWith("http://") && looksLikeImage(value))
        throw new Error("Assets de imagem têm de usar HTTPS.");
      return value;
    }
    if (Array.isArray(value))
      return Promise.all(value.map((item) => visit(item, key)));
    if (value && typeof value === "object") {
      return Object.fromEntries(
        await Promise.all(
          Object.entries(value).map(async ([childKey, child]) => [
            childKey,
            await visit(child, childKey),
          ]),
        ),
      );
    }
    return value;
  }

  return {
    payload: (await visit(payload)) as typeof payload,
    assetCount: cache.size,
    assetBytes: totalBytes,
  };
}

function safeBuildEnvironment(temporaryRoot: string): NodeJS.ProcessEnv {
  const allowlist = [
    "PATH",
    "SystemRoot",
    "WINDIR",
    "ComSpec",
    "PATHEXT",
    "USERPROFILE",
    "HOME",
    "APPDATA",
    "LOCALAPPDATA",
    "TEMP",
    "TMP",
    "ProgramFiles",
  ];
  const environment = Object.fromEntries(
    allowlist.flatMap((key) =>
      process.env[key] ? [[key, process.env[key]!]] : [],
    ),
  ) as NodeJS.ProcessEnv;
  const npmConfig = resolve(temporaryRoot, ".npmrc");
  writeFileSync(npmConfig, "", { flag: "wx" });
  return {
    ...environment,
    CI: "1",
    NODE_ENV: "production" as const,
    NEXT_TELEMETRY_DISABLED: "1",
    npm_config_userconfig: npmConfig,
    npm_config_cache: resolve(temporaryRoot, "npm-cache"),
  };
}

export function runIndependentBuild(
  projectRoot: string,
  temporaryRoot: string,
  allowInstallScripts = false,
) {
  const executable = process.platform === "win32" ? "npm.cmd" : "npm";
  const options = {
    cwd: projectRoot,
    env: safeBuildEnvironment(temporaryRoot),
    stdio: "pipe" as const,
    timeout: 8 * 60 * 1000,
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
    encoding: "utf8" as const,
    shell: process.platform === "win32",
  };
  execFileSync(
    executable,
    [
      "install",
      "--include=dev",
      ...(allowInstallScripts ? [] : ["--ignore-scripts"]),
      "--no-audit",
      "--no-fund",
    ],
    options,
  );
  execFileSync(executable, ["run", "build"], options);
}

export function walkClientPackage(root: string): ClientPackageEntry[] {
  const entries: ClientPackageEntry[] = [];
  const visit = (current: string) => {
    for (const item of readdirSync(current, { withFileTypes: true })) {
      if (
        [".next", "node_modules", ".git"].includes(item.name) ||
        item.name === "next-env.d.ts" ||
        item.name === "tsconfig.tsbuildinfo"
      )
        continue;
      const absolute = join(current, item.name);
      const path = relative(root, absolute).replaceAll("\\", "/");
      if (item.isSymbolicLink()) {
        entries.push({
          path,
          category: "frontend",
          symbolicLink: true,
          content: "",
        });
      } else if (item.isDirectory()) {
        visit(absolute);
      } else if (item.isFile()) {
        entries.push({
          path,
          category: categoryForPath(path),
          content: readFileSync(absolute),
        });
      }
    }
  };
  visit(root);
  return entries;
}

export type BuiltClientPackage = {
  archive: Uint8Array;
  audit: ClientPackageAudit;
  checksum: string;
  fileCount: number;
  totalBytes: number;
  assetCount: number;
  assetBytes: number;
  templateVersion: string;
};

export function createAuditedClientPackageArchive(
  entries: readonly ClientPackageEntry[],
  isolatedBuildPassed: boolean,
  mode: "LANDING_ONLY" | "LANDING_WITH_CMS" = "LANDING_ONLY",
  tenantIsolationPassed?: boolean,
) {
  const audit = auditClientPackage({
    mode,
    entries,
    isolatedBuildPassed,
    tenantIsolationPassed,
  });
  if (!audit.ready)
    throw new Error("Um pacote não auditado não pode ser arquivado.");
  const files: Record<string, unknown> = {};
  for (const entry of entries) {
    const segments = entry.path.split("/");
    let directory = files;
    for (const segment of segments.slice(0, -1)) {
      const current = directory[segment];
      if (
        current !== undefined &&
        (!current || typeof current !== "object" || ArrayBuffer.isView(current))
      ) {
        throw new Error(
          "O manifesto contém um caminho que colide com uma pasta do archive.",
        );
      }
      directory[segment] ??= {};
      directory = directory[segment] as Record<string, unknown>;
    }
    const content =
      typeof entry.content === "string"
        ? Buffer.from(entry.content)
        : entry.content;
    if (!content)
      throw new Error(
        "Um ficheiro sem conteúdo não pode ser incluído no archive.",
      );
    const filename = segments.at(-1)!;
    if (Object.hasOwn(directory, filename))
      throw new Error("O manifesto contém um caminho duplicado no archive.");
    directory[filename] = content;
  }
  return zipSync(files as Parameters<typeof zipSync>[0], {
    level: 0,
    mtime: new Date("1980-01-01T00:00:00.000Z"),
  });
}

export async function assembleAuditedLandingOnlyPackage(
  composition: ClientRuntimeComposition,
  sourceOverrides: Record<string, string> = {},
): Promise<BuiltClientPackage> {
  if (composition.mode !== "LANDING_ONLY")
    throw new Error("Esta exportação só aceita o modo Landing Only.");
  const temporaryRoot = mkdtempSync(join(tmpdir(), "landingforge-export-"));
  const projectRoot = join(temporaryRoot, "client-project");
  try {
    assembleClientRuntimeProject(composition, projectRoot, sourceOverrides);
    const staticAssetSources = composition.template.sourceFiles.map((path) => ({
      path,
      source:
        sourceOverrides[path] ??
        readFileSync(resolve(process.cwd(), path), "utf8"),
    }));
    const staticAssetPaths = collectTemplateStaticAssetPaths(
      staticAssetSources,
      composition.template.key,
    );
    packageTemplateStaticAssets(
      staticAssetPaths,
      composition.template.key,
      projectRoot,
    );
    const payloadAssets = await packageClientRuntimeAssets(
      composition.payload,
      projectRoot,
    );
    writeFileSync(
      resolve(projectRoot, "src/client-runtime-payload.json"),
      `${JSON.stringify(payloadAssets.payload, null, 2)}\n`,
    );
    const manifestPath = resolve(
      projectRoot,
      "deployment/client-runtime-project-manifest.json",
    );
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<
      string,
      unknown
    >;
    manifest.buildVerified = false;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    runIndependentBuild(projectRoot, temporaryRoot);
    manifest.buildVerified = true;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const entries = walkClientPackage(projectRoot);
    const audit = auditClientPackage({
      mode: "LANDING_ONLY",
      entries,
      isolatedBuildPassed: true,
    });
    if (!audit.ready)
      return {
        archive: new Uint8Array(),
        audit,
        checksum: "",
        fileCount: audit.fileCount,
        totalBytes: audit.totalBytes,
        assetCount: payloadAssets.assetCount,
        assetBytes: payloadAssets.assetBytes,
        templateVersion: composition.payload.templateVersion,
      };
    const archive = createAuditedClientPackageArchive(entries, true);
    const checksum = createHash("sha256").update(archive).digest("hex");
    return {
      archive,
      audit,
      checksum,
      fileCount: audit.fileCount,
      totalBytes: audit.totalBytes,
      assetCount: payloadAssets.assetCount,
      assetBytes: payloadAssets.assetBytes,
      templateVersion: composition.payload.templateVersion,
    };
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}
