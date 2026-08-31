import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

// ── Shared global sets ──────────────────────────────────────────────────────
// Node/dev-tooling globals for scripts, config files, and image builders.
const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  require: 'readonly',
  module: 'writable',
  exports: 'writable',
  __dirname: 'readonly',
  __filename: 'readonly',
  Buffer: 'readonly',
  global: 'readonly',
  fetch: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
};

const jestGlobals = {
  jest: 'readonly',
  expect: 'readonly',
  it: 'readonly',
  describe: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  test: 'readonly',
};

export default [
  {
    // Not app code: build output, native projects, parallel-session git
    // worktrees under `.claude/`, and the Deno edge functions (own runtime +
    // `deno lint` — linting them with the React Native config is meaningless).
    ignores: [
      'node_modules/',
      'build/',
      'dist/',
      '.expo/',
      'android/',
      'ios/',
      'coverage/',
      '.claude/',
      'supabase/functions/',
    ],
  },
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
        // The bulk Quran download uses XHR rather than fetch: fetch in RN
        // cannot report download progress, so it can only offer a flat abort
        // across a multi-MB body. See DOWNLOAD_TUNING in quranService.ts.
        XMLHttpRequest: 'readonly',
        Response: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        alert: 'readonly',
        global: 'readonly',
        // RN global used by App.tsx's top-level error boundary
        ErrorUtils: 'readonly',
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
      // A web/HTML rule. React Native `<Text>` renders a raw `'` or `"` fine,
      // and this only ever fired on ordinary apostrophes in UI copy ("you'll",
      // "don't") — escaping those to `&apos;` would be wrong here.
      'react/no-unescaped-entities': 'off',
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
      // `warn`, not `error`. This codebase predates the Prettier rule and was
      // never run through `prettier --write`, so essentially every file drifts
      // from Prettier's output (~4.8k findings). A blanket format pass would be
      // a five-figure-line diff that collides with every in-flight branch and
      // is explicitly banned on `src/data/quranData.ts` (CRLF + tri-lingual
      // prose, not Prettier-clean by design — see CLAUDE.md). Keeping this as a
      // warning surfaces drift in newly-touched code (editor format-on-save and
      // `npm run format` still work) without turning CI into a wall. Promote
      // back to `error` after a dedicated repo-wide format pass + a pre-commit
      // hook land together.
      'prettier/prettier': 'warn',
    },
  },
  {
    // Jest test, setup, and mock files — add the test globals plus Node
    // globals (mocks and setup reach for `jest`, `process`, timers, etc.).
    files: [
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/__mocks__/**/*.{js,jsx,ts,tsx}',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      'jest.setup.{js,ts}',
    ],
    languageOptions: {
      globals: { ...jestGlobals, ...nodeGlobals },
    },
  },
  {
    // Node ESM/CJS dev tooling: `scripts/` (both .js and .mjs) and the
    // `store-assets/` image-compositing builders. Not React Native — the main
    // config's `files` glob covers only js/jsx/ts/tsx, so `.mjs` here would
    // otherwise lint with no Node globals at all.
    files: ['scripts/**/*.{js,mjs}', 'store-assets/**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: nodeGlobals,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Dev-tooling regex idioms. CLAUDE.md flags the Arabic character classes
      // in `verify-tafsir-tags.mjs` / `verify-citations.mjs` as trap-prone and
      // hand-tuned — a lint rule must not force an edit there.
      'no-misleading-character-class': 'warn',
    },
  },
  {
    // Root CommonJS config files (Babel, Metro, Jest).
    files: ['*.config.{js,cjs}', 'babel.config.js', 'metro.config.js', 'react-native.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: nodeGlobals,
    },
  },
];
