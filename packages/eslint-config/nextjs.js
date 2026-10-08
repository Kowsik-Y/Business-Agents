import baseConfig from "./base.js";
import globals from "globals";

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    ignores: ["next-env.d.ts", ".next/**"],
  },
];
