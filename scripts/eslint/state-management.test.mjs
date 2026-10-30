import { RuleTester } from "eslint";
import { stateManagement } from "./state-management.mjs";

const tester = new RuleTester({ languageOptions: { ecmaVersion: "latest", sourceType: "module" } });
const filename = `${process.cwd()}/src/components/Example.js`;
const hook = `${process.cwd()}/src/lib/hooks/use-example.js`;
tester.run("state-management", stateManagement, {
  valid: [
    {
      filename,
      code: 'import { useReducer } from "react"; function Example() { return useReducer((s, a) => a, false); }',
    },
    {
      filename: hook,
      code: 'import { useEffect as effect } from "react"; export function useExample() { effect(() => {}, []); }',
    },
    {
      filename: hook,
      code: 'import React from "react"; const useExample = () => { React.useLayoutEffect(() => {}, []); };',
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
      code: 'import { useEffect } from "react"; function Example() { useEffect(() => {}, []); }',
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
