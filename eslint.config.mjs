import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";

const compat = new FlatCompat({
  baseDirectory: path.resolve(),
});

const config = [
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off",
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: ["node_modules", ".next/**/*"],
  },
];

export default config;
