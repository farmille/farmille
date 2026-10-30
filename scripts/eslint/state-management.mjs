import path from "node:path";

const effects = new Set(["useEffect", "useLayoutEffect"]);
const nameOf = (node) => node.name ?? node.value;

export const stateManagement = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      state: "局所UI状態はuseReducer、フォーム入力はTanStack Formで管理する。useStateは使わない。",
      effect: "Effectはsrc/lib/hooks/の用途別カスタムフック内でだけ使う。",
      form: "フォーム入力はreact-hook-formを使わずTanStack Formで管理する。",
      static: "ReactのAPIは静的importと明示したプロパティ名で参照する。",
    },
  },
  create(context) {
    const source = context.sourceCode;
    const hooksPath = path.resolve(context.cwd, "src/lib/hooks") + path.sep;
    const inHooks = path.resolve(context.filename).startsWith(hooksPath);
    const checked = new Set();

    function checkApi(node, api) {
      if (api === "useState") context.report({ node, messageId: "state" });
      if (!effects.has(api)) return;
      if (!inHooks) {
        context.report({ node, messageId: "effect" });
        return;
      }
      if (node.type === "ImportSpecifier" || node.type === "ExportSpecifier") return;
      let fn = node.parent;
      while (
        fn &&
        !/^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(fn.type)
      ) {
        fn = fn.parent;
      }
      const name =
        fn?.id?.name ?? (fn?.parent?.type === "VariableDeclarator" ? fn.parent.id.name : undefined);
      if (!name || !/^use[A-Z0-9]/.test(name)) context.report({ node, messageId: "effect" });
    }

    function references(variable, api) {
      if (!variable || checked.has(variable)) return;
      checked.add(variable);
      for (const reference of variable.references) {
        if (!reference.isRead()) continue;
        const id = reference.identifier;
        const parent = id.parent;
        if (parent.type === "VariableDeclarator" && parent.init === id) {
          if (parent.id.type === "Identifier") {
            references(source.getDeclaredVariables(parent)[0], api);
          } else if (!api && parent.id.type === "ObjectPattern") {
            for (const property of parent.id.properties) {
              if (property.type !== "Property") continue;
              const imported = nameOf(property.key);
              checkApi(property, imported);
              references(
                source
                  .getDeclaredVariables(parent)
                  .find((item) => item.name === property.value.name),
                imported,
              );
            }
          }
          continue;
        }
        if (api) {
          checkApi(id, api);
        } else if (parent.type === "MemberExpression" && parent.object === id) {
          if (parent.computed && parent.property.type !== "Literal") {
            context.report({ node: parent, messageId: "static" });
            continue;
          }
          const imported = nameOf(parent.property);
          checkApi(parent, imported);
          if (parent.parent.type === "VariableDeclarator") {
            references(source.getDeclaredVariables(parent.parent)[0], imported);
          }
        }
      }
    }

    return {
      ImportDeclaration(node) {
        if (/^react-hook-form(?:\/|$)/.test(node.source.value)) {
          context.report({ node, messageId: "form" });
        }
        if (node.source.value !== "react") return;
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportSpecifier") checkApi(specifier, nameOf(specifier.imported));
        }
      },
      "Program:exit"(node) {
        for (const statement of node.body) {
          if (statement.type !== "ImportDeclaration" || statement.source.value !== "react")
            continue;
          for (const specifier of statement.specifiers) {
            const api = specifier.type === "ImportSpecifier" ? nameOf(specifier.imported) : null;
            for (const variable of source.getDeclaredVariables(specifier))
              references(variable, api);
          }
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source?.value === "react") {
          for (const specifier of node.specifiers) {
            const api = nameOf(specifier.local);
            if (effects.has(api)) context.report({ node: specifier, messageId: "effect" });
            else checkApi(specifier, api);
          }
        }
        if (/^react-hook-form(?:\/|$)/.test(node.source?.value ?? "")) {
          context.report({ node, messageId: "form" });
        }
      },
      ExportAllDeclaration(node) {
        if (node.source.value === "react" || /^react-hook-form(?:\/|$)/.test(node.source.value)) {
          context.report({ node, messageId: "static" });
        }
      },
      ImportExpression(node) {
        if (["react", "react-hook-form"].includes(node.source.value))
          context.report({ node, messageId: "static" });
      },
      CallExpression(node) {
        if (
          node.callee.name === "require" &&
          ["react", "react-hook-form"].includes(node.arguments[0]?.value)
        ) {
          context.report({ node, messageId: "static" });
        }
      },
    };
  },
};

const plugin = { rules: { "state-management": stateManagement } };
export default plugin;
