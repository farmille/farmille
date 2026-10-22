import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import * as v from "valibot";

export const StorySelectionSchema = v.variant("mode", [
  v.object({ mode: v.literal("all"), reason: v.string() }),
  v.object({
    mode: v.literal("selected"),
    files: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  v.object({ mode: v.literal("none"), reason: v.string() }),
]);
export type StorySelection = v.InferOutput<typeof StorySelectionSchema>;

export type CiPlan = {
  storybook: StorySelection;
  e2e: boolean;
};

// メール雛形は Supabase が読む実行入力なので、資料だけの変更には含めない。
function isDocumentation(file: string): boolean {
  return (
    (file.startsWith("docs/") && !file.startsWith("docs/email-templates/")) ||
    /^(?:\.agents|\.claude|\.codex)\//.test(file) ||
    /^[^/]+\.md$/.test(file)
  );
}

function isUnitTest(file: string): boolean {
  return (
    file.startsWith("src/") && (/\.(?:test|spec)\.tsx?$/.test(file) || file.includes("/__tests__/"))
  );
}

function isStoryOnly(file: string): boolean {
  return (
    /\.stories\.tsx?$/.test(file) ||
    file.startsWith(".storybook/") ||
    file.startsWith("storybook-tests/") ||
    file === "playwright.storybook.config.ts" ||
    file === "scripts/storybook-static-server.mjs"
  );
}

function isE2eOnly(file: string): boolean {
  return file.startsWith("e2e/") || file === "playwright.config.ts";
}

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`依存関係を追跡できないシンボリックリンク：${file}`);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.[cm]?[jt]sx?$/.test(file) ? [file] : [];
  });
}

// import・再export・文字列の動的importを逆向きにたどり、別ルートの利用先も検査する。
function affectedStories(root: string, changedFiles: string[]): StorySelection {
  const config = ts.getParsedCommandLineOfConfigFile(
    path.join(root, "tsconfig.json"),
    {},
    {
      ...ts.sys,
      getCurrentDirectory: () => root,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      },
    },
  );
  if (!config || config.errors.length > 0) {
    throw new Error("tsconfig.json を読み取れず、Story の依存関係を判定できません。");
  }

  const files = sourceFiles(path.join(root, "src"));
  const importers = new Map<string, Set<string>>();
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    let computedImport = false;
    const dependencies = new Set<string>();
    function visit(node: ts.Node): void {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteralLike(node.moduleSpecifier)
      ) {
        dependencies.add(node.moduleSpecifier.text);
      }
      if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression &&
        ts.isStringLiteralLike(node.moduleReference.expression)
      ) {
        dependencies.add(node.moduleReference.expression.text);
      }
      if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteralLike(node.argument.literal)
      ) {
        dependencies.add(node.argument.literal.text);
      }
      if (ts.isCallExpression(node)) {
        const expression = node.expression;
        const moduleCall =
          expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(expression) && expression.text === "require") ||
          (ts.isPropertyAccessExpression(expression) &&
            ts.isIdentifier(expression.expression) &&
            expression.expression.text === "require" &&
            expression.name.text === "resolve");
        if (moduleCall) {
          const argument = node.arguments[0];
          if (argument && ts.isStringLiteralLike(argument)) dependencies.add(argument.text);
          else computedImport = true;
        }
        if (ts.isPropertyAccessExpression(expression) && ts.isMetaProperty(expression.expression))
          computedImport = true;
      }
      ts.forEachChild(node, visit);
    }
    visit(parsed);
    if (computedImport) return { mode: "all", reason: "計算された import があるため全件検査" };

    for (const dependencyName of dependencies) {
      const resolved = ts.resolveModuleName(
        dependencyName,
        file,
        config.options,
        ts.sys,
      ).resolvedModule;
      if (!resolved) {
        // 画像やCSSは型解決の対象外。これらの変更自体は常に全件検査になる。
        const asset = dependencyName.startsWith(".")
          ? path.resolve(path.dirname(file), dependencyName)
          : dependencyName.startsWith("@/")
            ? path.join(root, "src", dependencyName.slice(2))
            : null;
        if (
          asset &&
          fs.existsSync(asset) &&
          fs.statSync(asset).isFile() &&
          !/\.[cm]?[jt]sx?$/.test(asset)
        )
          continue;
        if (dependencyName.startsWith(".") || dependencyName.startsWith("@/")) {
          return { mode: "all", reason: `静的に解決できない依存：${dependencyName}` };
        }
        continue;
      }
      const dependency = path.resolve(resolved.resolvedFileName);
      const parents = importers.get(dependency) ?? new Set<string>();
      parents.add(file);
      importers.set(dependency, parents);
    }
  }

  const selected = new Set<string>();
  for (const changedFile of changedFiles) {
    const affected = new Set([path.join(root, changedFile)]);
    for (const file of affected) {
      for (const parent of importers.get(file) ?? []) affected.add(parent);
    }
    const stories = files.filter((file) => /\.stories\.tsx?$/.test(file) && affected.has(file));
    // ほかの変更に Story があっても、利用先を追えない変更を無検査にはしない。
    if (stories.length === 0)
      return { mode: "all", reason: `Story を特定できない変更：${changedFile}` };
    for (const story of stories) selected.add(path.relative(root, story).split(path.sep).join("/"));
  }
  const stories = [...selected].sort();
  return { mode: "selected", files: stories };
}

export function createCiPlan(root: string, changedFiles: string[], full: boolean): CiPlan {
  if (full) return { storybook: { mode: "all", reason: "main は全件検査" }, e2e: true };

  const e2e = changedFiles.some(
    (file) => !isDocumentation(file) && !isStoryOnly(file) && !isUnitTest(file),
  );
  const storyChanges = changedFiles.filter(
    (file) => !isDocumentation(file) && !isE2eOnly(file) && !isUnitTest(file),
  );
  if (storyChanges.length === 0) {
    return { storybook: { mode: "none", reason: "画面に影響する変更なし" }, e2e };
  }

  // 共通部品・CSS・テーマ・設定・画像と、Next の暗黙の親画面は全件検査する。
  const globalChange = storyChanges.find(
    (file) =>
      !/^src\/app\/.*\.tsx?$/.test(file) ||
      /\/(?:layout|template|error|global-error|not-found|loading)\.tsx?$/.test(file) ||
      file.includes("/__mocks__/") ||
      file.endsWith(".d.ts") ||
      !fs.existsSync(path.join(root, file)),
  );
  if (globalChange) {
    return { storybook: { mode: "all", reason: `全画面への影響を確認：${globalChange}` }, e2e };
  }
  return { storybook: affectedStories(root, storyChanges), e2e };
}

export function selectStoryFiles(selection: StorySelection, indexedFiles: string[]): Set<string> {
  if (indexedFiles.length === 0) throw new Error("Storybook の index に Story がありません。");
  const available = new Set(indexedFiles.map((file) => file.replace(/^\.\//, "")));
  if (selection.mode === "none")
    throw new Error("検査不要の計画で Storybook 検査が起動されました。");
  if (selection.mode === "all") return available;
  for (const file of selection.files) {
    if (!available.has(file)) throw new Error(`検査対象の Story が index にありません：${file}`);
  }
  return new Set(selection.files);
}
