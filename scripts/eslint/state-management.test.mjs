import { RuleTester } from "eslint";
import { controlledFormInput, stateManagement } from "./state-management.mjs";

const tester = new RuleTester({ languageOptions: { ecmaVersion: "latest", sourceType: "module" } });
const filename = `${process.cwd()}/src/components/Example.js`;
const mountEffect = `${process.cwd()}/src/lib/hooks/use-mount-effect.ts`;
const hook = `${process.cwd()}/src/lib/hooks/use-example.ts`;
tester.run("state-management", stateManagement, {
  valid: [
    {
      filename,
      code: 'import { useReducer } from "react"; function Example() { return useReducer((s, a) => a, false); }',
    },
    {
      filename: mountEffect,
      code: 'import { useEffect } from "react"; export function useMountEffect(effect) { useEffect(effect, []); }',
    },
    { filename, code: "const x = { useState() {} }; x.useState();" },
    { filename, code: 'import React from "react"; function x(React) { React.useState(); }' },
    { filename, code: 'import { useForm } from "@tanstack/react-form";' },
  ],
  invalid: [
    {
      filename: hook,
      code: 'export { useEffect as useSynchronization } from "react";',
      errors: [{ messageId: "effect" }],
    },
    {
      filename,
      code: 'import { useState as state } from "react";',
      errors: [{ messageId: "state" }],
    },
    {
      filename,
      code: 'import React from "react"; React.useState(false);',
      errors: [{ messageId: "state" }],
    },
    {
      filename,
      code: 'import * as R from "react"; R["useState"](false);',
      errors: [{ messageId: "state" }],
    },
    {
      filename,
      code: 'import React from "react"; const R = React; R.useEffect(() => {}, []);',
      errors: [{ messageId: "effect" }],
    },
    {
      filename,
      code: 'import React from "react"; const { useState: state } = React;',
      errors: [{ messageId: "state" }],
    },
    { filename, code: 'import { useEffect } from "react";', errors: [{ messageId: "effect" }] },
    {
      filename: hook,
      code: 'import { useEffect } from "react"; export function useExample() { useEffect(() => {}, []); }',
      errors: [{ messageId: "effect" }],
    },
    {
      filename: hook,
      code: 'import React from "react"; const useExample = () => { React.useLayoutEffect(() => {}, []); };',
      errors: [{ messageId: "effect" }],
    },
    {
      filename: mountEffect,
      code: 'import { useEffect } from "react"; export function useMountEffect(effect, deps) { useEffect(effect, deps); }',
      errors: [{ messageId: "effect" }],
    },
    {
      filename: mountEffect,
      code: 'import { useEffect } from "react"; export const run = useEffect;',
      errors: [{ messageId: "effect" }],
    },
    {
      filename,
      code: 'import { useInsertionEffect } from "react";',
      errors: [{ messageId: "effect" }],
    },
    {
      filename,
      code: 'export { useState as state } from "react";',
      errors: [{ messageId: "state" }],
    },
    {
      filename,
      code: 'import { useForm } from "react-hook-form";',
      errors: [{ messageId: "form" }],
    },
    { filename, code: 'const React = await import("react");', errors: [{ messageId: "static" }] },
    { filename, code: 'const React = require("react");', errors: [{ messageId: "static" }] },
  ],
});

new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
}).run("controlled-form-input", controlledFormInput, {
  valid: [
    'import { Input } from "@/components/form"; const x = <Input name="email" value={value} />;',
    'import { Checkbox } from "@/components/form"; const x = <Checkbox name="terms" checked={value} />;',
    'import { Input } from "@/components/form"; function x(Input) { return <Input name="other" />; }',
    'const x = <input name="id" type="hidden" value="id" />;',
    'const x = <input name="photo" type="file" />;',
    'const x = <input name="field" {...props} />;',
    'const x = <input placeholder="検索" />;',
  ],
  invalid: [
    {
      code: 'import { Input as Field } from "@/components/form"; const x = <Field name="email" defaultValue="" />;',
      errors: [{ messageId: "controlled" }],
    },
    {
      code: 'import { Checkbox } from "@/components/form/Checkbox"; const x = <Checkbox name="terms" value="yes" />;',
      errors: [{ messageId: "controlled" }],
    },
    { code: 'const x = <textarea name="body" />;', errors: [{ messageId: "controlled" }] },
    {
      code: 'const x = <input name="terms" type="checkbox" />;',
      errors: [{ messageId: "controlled" }],
    },
  ],
});
