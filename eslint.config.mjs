import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", ".expo/**", "dist/**", "docs/**"],
  },
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "prettier/prettier": ["warn", { endOfLine: "auto" }],
    },
  },
];
