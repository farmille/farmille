import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const sourceRoot = path.resolve("src");

const sharedScreenComponents = new Map([
  [
    "src/app/dev/tokens/page.tsx",
    {
      component: "./TokenCatalog",
      reason: "本番の開発画面ガードを維持し、共通の表示部品を描画する",
    },
  ],
  [
    "src/app/dev/ui/page.tsx",
    { component: "./UiCatalog", reason: "本番の開発画面ガードを維持し、共通の表示部品を描画する" },
  ],
]);

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

const routeExceptions = new Map([
  [
    "src/app/dashboard/materials/new/page.tsx",
    "資材掲載申請へのリダイレクト専用で、画面を描画しない",
  ],
]);

const screenModules = new Map([
  ["page.tsx", "Page"],
  ["error.tsx", "Error"],
  ["not-found.tsx", "NotFound"],
  ["loading.tsx", "Loading"],
]);

let screenCount = 0;
const detachedStories = [];

let componentCount = 0;

for (const componentPath of componentModules) {
  const fileName = path.basename(componentPath);
  const screenName = screenModules.get(fileName);

  if (screenName) {
    const relativePath = path.relative(process.cwd(), componentPath);

    if (routeExceptions.has(relativePath)) continue;
    screenCount += 1;
    const storyPath = path.join(path.dirname(componentPath), `${screenName}.stories.tsx`);

    try {
      const storySource = await readFile(storyPath, "utf8");

      const screenImport =
        sharedScreenComponents.get(relativePath)?.component ??
        `./${path.basename(componentPath, ".tsx")}`;

      const storyModule = ts.createSourceFile(storyPath, storySource, ts.ScriptTarget.Latest);

      const importsScreen = storyModule.statements.some((statement) => {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
          return false;
        const clause = statement.importClause;

        if (statement.moduleSpecifier.text !== screenImport || !clause || clause.isTypeOnly)
          return false;

        if (clause.name) return true;
        const bindings = clause.namedBindings;

        return (
          bindings &&
          ts.isNamedImports(bindings) &&
          bindings.elements.some((binding) => !binding.isTypeOnly)
        );
      });

      if (!importsScreen) detachedStories.push(storyPath);

      if (!storySource.includes('title: "Pages/')) detachedStories.push(storyPath);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT")
        missingStories.push(storyPath);
      else throw error;
    }

    continue;
  }

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
  console.log(`${componentCount}件のコンポーネントと${screenCount}件の画面に Story があります。`);

  for (const [routePath, reason] of routeExceptions)
    console.log(`画面を持たない経路 ${routePath}：${reason}`);

  for (const [routePath, { reason }] of sharedScreenComponents)
    console.log(`表示部品を共有する経路 ${routePath}：${reason}`);
}
