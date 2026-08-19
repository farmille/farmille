import { readdir } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = process.cwd();
const sourceRoot = path.join(repositoryRoot, "src");

const nextReservedFiles = new Set([
  "apple-icon.tsx",
  "default.tsx",
  "error.tsx",
  "forbidden.tsx",
  "global-error.tsx",
  "global-not-found.tsx",
  "icon.tsx",
  "layout.tsx",
  "loading.tsx",
  "not-found.tsx",
  "opengraph-image.tsx",
  "page.tsx",
  "template.tsx",
  "twitter-image.tsx",
  "unauthorized.tsx",
]);

async function collectTsxFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectTsxFiles(entryPath);
      if (!entry.isFile() || !entry.name.endsWith(".tsx")) return [];
      return [entryPath];
    }),
  );

  return files.flat();
}

function componentStem(fileName) {
  for (const suffix of [".stories.tsx", ".test.tsx", ".spec.tsx", ".tsx"]) {
    if (fileName.endsWith(suffix)) return fileName.slice(0, -suffix.length);
  }

  return fileName;
}

const tsxFiles = await collectTsxFiles(sourceRoot);
const invalidFiles = tsxFiles.filter((file) => {
  const relativePath = path.relative(repositoryRoot, file);
  const isAppFile = relativePath.startsWith(`src${path.sep}app${path.sep}`);
  if (isAppFile && nextReservedFiles.has(path.basename(file))) return false;
  if (relativePath === path.join("src", "mdx-components.tsx")) return false;

  return !/^[A-Z][A-Za-z0-9]*$/.test(componentStem(path.basename(file)));
});

if (invalidFiles.length > 0) {
  console.error("PascalCase ではないコンポーネントファイルがあります：");
  for (const file of invalidFiles) console.error(`- ${path.relative(repositoryRoot, file)}`);
  process.exitCode = 1;
} else {
  console.log(`${tsxFiles.length}件の TSX ファイル名を確認しました。`);
}
