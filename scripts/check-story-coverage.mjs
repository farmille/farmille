import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const sourceRoot = path.resolve("src");
const routeModuleNames = new Set([
  "error.tsx",
  "layout.tsx",
  "loading.tsx",
  "not-found.tsx",
  "opengraph-image.tsx",
  "page.tsx",
]);

async function collectComponentModules(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectComponentModules(entryPath);
      if (!entry.isFile() || !entry.name.endsWith(".tsx")) return [];
      if (
        entry.name.endsWith(".stories.tsx") ||
        entry.name.endsWith(".test.tsx") ||
        routeModuleNames.has(entry.name)
      )
        return [];
      return [entryPath];
    }),
  );

  return files.flat();
}

const componentModules = await collectComponentModules(sourceRoot);
const missingStories = [];
const detachedStories = [];

for (const componentPath of componentModules) {
  const basename = path.basename(componentPath, ".tsx");
  const storyPath = path.join(path.dirname(componentPath), `${basename}.stories.tsx`);

  try {
    const storySource = await readFile(storyPath, "utf8");
    const relativeImport = `./${basename}`;
    if (!storySource.includes(relativeImport)) detachedStories.push(storyPath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      missingStories.push(storyPath);
      continue;
    }
    throw error;
  }
}

if (missingStories.length > 0 || detachedStories.length > 0) {
  if (missingStories.length > 0) {
    console.error("Story がないコンポーネント:");
    for (const storyPath of missingStories)
      console.error(`- ${path.relative(process.cwd(), storyPath)}`);
  }
  if (detachedStories.length > 0) {
    console.error("対象コンポーネントを import していない Story:");
    for (const storyPath of detachedStories)
      console.error(`- ${path.relative(process.cwd(), storyPath)}`);
  }
  process.exitCode = 1;
} else {
  console.log(`${componentModules.length}件のコンポーネントに Story があります。`);
}
