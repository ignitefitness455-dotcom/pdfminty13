import js from '@eslint/js';
// @ts-ignore
import reactPlugin from 'eslint-plugin-react';
// @ts-ignore
import reactHooksPlugin from 'eslint-plugin-react-hooks';
// @ts-ignore
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
// @ts-ignore
import importXPlugin from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'functions/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      react: reactPlugin as any,
      'react-hooks': reactHooksPlugin as any,
      'jsx-a11y': jsxA11yPlugin as any,
      'import-x': importXPlugin as any,
    },
    rules: {
      ...reactPlugin.configs?.recommended?.rules,
      ...reactHooksPlugin.configs?.recommended?.rules,
      ...jsxA11yPlugin.configs?.recommended?.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'no-useless-assignment': 'off',
      'no-control-regex': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'preserve-caught-error': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-unused-vars': 'off',
      'no-console': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  prettierConfig as any
);
