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

const componentModules = (await readdir(sourceRoot, { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
  .map((entry) => path.join(entry.parentPath, entry.name));
const missingStories = [];
const detachedStories = [];

let componentCount = 0;
for (const componentPath of componentModules) {
  const fileName = path.basename(componentPath);
  if (
    fileName.endsWith(".stories.tsx") ||
    fileName.endsWith(".test.tsx") ||
    routeModuleNames.has(fileName)
  )
    continue;
  componentCount += 1;
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
  console.log(`${componentCount}件のコンポーネントに Story があります。`);
}
