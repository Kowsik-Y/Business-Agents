import baseConfig from "./base.js";

export default [
  ...baseConfig,
  {
    rules: {
      // Library packages should be stricter
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];
