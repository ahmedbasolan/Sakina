import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // React Native / Node.js globals
        __DEV__: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        require: 'readonly',
        process: 'readonly',
        module: 'readonly',
        URL: 'readonly',
        FormData: 'readonly',
        AbortController: 'readonly',
        Response: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        alert: 'readonly',
        global: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      // NOT reactHooksPlugin.configs.recommended — as of eslint-plugin-react-hooks
      // v5+/v7, "recommended" is the React Compiler rule set (refs/purity/
      // immutability/static-components/etc.), not just hooks correctness. This
      // app doesn't use the React Compiler (no babel plugin for it), and those
      // rules flagged 330 false positives on the standard, safe RN idiom
      // `useRef(new Animated.Value(x)).current` used throughout the codebase —
      // reading `.current` once at mount is fine under React's actual (non-
      // compiled) runtime; it's only unsafe under compiler memoization
      // assumptions this project doesn't make. Only the two rules that predate
      // the compiler era and apply regardless are kept, explicitly below.
      'react/react-in-jsx-scope': 'off',
      // A pre-TypeScript-era rule (runtime PropTypes.propTypes declarations) —
      // this codebase has none; prop validation is TypeScript's job. Only ever
      // fired 2 false positives on typed-but-not-PropTypes-declared props.
      'react/prop-types': 'off',
      // React Native's Metro bundler requires `require('./x.png')` for static
      // image assets — `import` doesn't resolve them the same way, so this
      // TypeScript-import-style rule is unusable here. Also flagged Jest's own
      // dynamic `require()` re-import pattern in tests.
      '@typescript-eslint/no-require-imports': 'off',
      // Respect the `_`-prefix convention for intentionally-unused bindings
      // (ignored catch errors, placeholder params for a stable signature, etc.).
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Matches the codebase's existing `.catch(() => {})` no-op convention —
      // an empty catch is a deliberate "best effort, degrade silently" choice
      // here, not an accident.
      'no-empty': ['error', { allowEmptyCatch: true }],
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
    },
  },
  // Jest test files — add test globals
  {
    files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        test: 'readonly',
      },
    },
  },
  {
    // Node ESM dev tooling (scripts/*.mjs) — not React Native, and the main
    // config's `files` glob only covers js/jsx/ts/tsx, so these would
    // otherwise lint with no Node globals defined.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
  {
    ignores: ['node_modules/', 'build/', 'dist/', '.expo/', 'android/', 'ios/', 'coverage/'],
  },
];
