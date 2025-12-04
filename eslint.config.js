import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 1) global ignores
  { ignores: ['dist', '.next'] },

  // 2) base JS rules
  js.configs.recommended,

  // 3) TS rules
  ...tseslint.configs.recommendedTypeChecked,

  // 4) Next.js rules
  nextPlugin.configs['core-web-vitals'],

  // 5) your project-specific overrides
  {
    name: 'core-rules',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
    settings: {
      next: {
        rootDir: ['app/*/'],
      },
    },
  }
);
