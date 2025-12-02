import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', '.next'] },
  {
    name: 'core-rules',
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked, nextPlugin.configs['core-web-vitals']],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      next: nextPlugin,
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
