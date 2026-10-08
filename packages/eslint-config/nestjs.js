import baseConfig from "./base.js";

export default [
  ...baseConfig,
  {
    rules: {
      // NestJS uses decorators and class patterns
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
