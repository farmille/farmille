import path from "node:path";

import { eslintCompatPlugin } from "@oxlint/plugins";

import { restrictedSyntax } from "./restricted-syntax.mjs";

const effects = new Set(["useEffect", "useLayoutEffect", "useInsertionEffect"]);
const nameOf = (node) => node.name ?? node.value;

export const stateManagement = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      state: "局所UI状態はuseReducer、フォーム入力はTanStack Formで管理する。useStateは使わない。",
      effect:
        "Effectを直接使わない。派生値・イベントハンドラ・keyによる再マウントで書き、マウント時の外部同期だけuseMountEffectを使う。",
      form: "フォーム入力はreact-hook-formを使わずTanStack Formで管理する。",
      static: "ReactのAPIは静的importと明示したプロパティ名で参照する。",
    },
  },
  create(context) {
    const source = context.sourceCode;
    // oxlintのcwdは実行のしかたで変わるので、リポジトリ内のパスの末尾で判定する
    const inMountEffect = path
      .resolve(context.filename)
      .endsWith(path.join(path.sep, "src", "lib", "hooks", "use-mount-effect.ts"));
    const checked = new Set();

    function checkApi(node, api) {
      if (api === "useState") context.report({ node, messageId: "state" });
      if (!effects.has(api)) return;
      if (!inMountEffect) {
        // 名前付きimportは宣言で一度だけ報告し、呼び出しごとには重ねない。
        if (node.type !== "Identifier") context.report({ node, messageId: "effect" });
        return;
      }
      if (node.type === "ImportSpecifier") return;
      const call = node.parent;
      const mountOnly =
        call?.type === "CallExpression" &&
        call.callee === node &&
        call.arguments[1]?.type === "ArrayExpression" &&
        call.arguments[1].elements.length === 0;
      if (!mountOnly) context.report({ node, messageId: "effect" });
    }

    function references(variable, api) {
      if (!variable || checked.has(variable)) return;
      checked.add(variable);
      for (const reference of variable.references) {
        if (!reference.isRead()) continue;
        const id = reference.identifier;
        const parent = id.parent;
        if (parent.type === "VariableDeclarator" && parent.init === id) {
          if (effects.has(api)) checkApi(id, api);
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

export const controlledFormInput = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      controlled: "名前付きの入力には、TanStack Formが所有する値をvalueまたはcheckedで渡す。",
    },
  },
  create(context) {
    const controls = new Map();
    const source = context.sourceCode;
    return {
      ImportDeclaration(node) {
        if (!/^@\/components\/form(?:\/|$)/.test(node.source.value)) return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          const name = nameOf(specifier.imported);
          if (
            !["Input", "SearchInput", "Textarea", "Select", "RadioGroup", "Checkbox"].includes(name)
          )
            continue;
          controls.set(specifier.local.name, {
            name,
            variable: source.getDeclaredVariables(specifier)[0],
          });
        }
      },
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return;
        const tag = node.name.name;
        const control = controls.get(tag);
        if (control) {
          let scope = source.getScope(node);
          while (scope && !scope.set.has(tag)) scope = scope.upper;
          if (scope?.set.get(tag) !== control.variable) return;
        } else if (!["input", "textarea", "select"].includes(tag)) return;

        if (node.attributes.some((attribute) => attribute.type === "JSXSpreadAttribute")) return;
        const attributes = new Map(
          node.attributes
            .filter((attribute) => attribute.type === "JSXAttribute")
            .map((attribute) => [attribute.name.name, attribute.value]),
        );
        if (!attributes.has("name")) return;
        const type = attributes.get("type");
        const inputType = type?.type === "Literal" ? type.value : type?.expression?.value;
        if (tag === "input" && ["hidden", "file"].includes(inputType)) return;
        const checked = control?.name === "Checkbox" || ["checkbox", "radio"].includes(inputType);
        if (!attributes.has(checked ? "checked" : "value")) {
          context.report({ node, messageId: "controlled" });
        }
      },
    };
  },
};

export default eslintCompatPlugin({
  meta: { name: "farmille" },
  rules: {
    "state-management": stateManagement,
    "controlled-form-input": controlledFormInput,
    "restricted-syntax": restrictedSyntax,
  },
});
