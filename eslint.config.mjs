// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import nextPlugin from "@next/eslint-plugin-next";

export default tseslint.config(
  // 1) Global ignores
  { ignores: ["node_modules", ".next", "dist"] },

  // 2) Base JS rules
  js.configs.recommended,

  // 3) TypeScript rules (type-checked)
  ...tseslint.configs.recommendedTypeChecked,

  // 4) Project / Next-specific overrides
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "@next/next": nextPlugin,
    },
    rules: {
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,

      // Next.js core-web-vitals rules
      ...nextPlugin.configs["core-web-vitals"].rules,

      // React Refresh rule
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  }
);
