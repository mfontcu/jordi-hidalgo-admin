import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Layers and dependency rules of ADR-003 (§2 Layers, §4 Dependency rules).
const SHARED = ['shared-api', 'shared-ui', 'shared-lib', 'shared-i18n', 'shared-config'];
const sameFeature = { captured: { feature: '{{ from.element.captured.feature }}' } };
const layer = (type, extra = {}) => ({ element: { type, ...extra } });
// Another feature is reachable only through its index.ts.
const featureEntry = layer('feature-entry', { fileInternalPath: 'index.ts' });

const boundaryElements = [
  { type: 'app', pattern: 'src/app' },
  { type: 'routes', pattern: 'src/routes' },
  { type: 'feature-ui', pattern: 'src/features/*/ui', capture: ['feature'] },
  { type: 'feature-hooks', pattern: 'src/features/*/hooks', capture: ['feature'] },
  { type: 'feature-api', pattern: 'src/features/*/api', capture: ['feature'] },
  { type: 'feature-model', pattern: 'src/features/*/model', capture: ['feature'] },
  // The feature folder itself: in practice its index.ts, the feature's public surface.
  { type: 'feature-entry', pattern: 'src/features/*', capture: ['feature'] },
  { type: 'shared-api', pattern: 'src/shared/api' },
  { type: 'shared-ui', pattern: 'src/shared/ui' },
  { type: 'shared-lib', pattern: 'src/shared/lib' },
  { type: 'shared-i18n', pattern: 'src/shared/i18n' },
  { type: 'shared-config', pattern: 'src/shared/config' },
  { type: 'test', pattern: 'src/test' },
];

const allow = (from, to) => ({
  from: { element: { type: from } },
  allow: { to: to.map((target) => (typeof target === 'string' ? layer(target) : target)) },
});

const boundaryPolicies = [
  // app is the composition root and may import anything.
  allow('app', ['app', 'routes', featureEntry, ...SHARED]),
  // routes reach features only through their index.ts.
  allow('routes', ['routes', featureEntry, ...SHARED]),
  // A feature's index.ts re-exports its own layers.
  allow('feature-entry', [
    layer('feature-ui', sameFeature),
    layer('feature-hooks', sameFeature),
    layer('feature-api', sameFeature),
    layer('feature-model', sameFeature),
  ]),
  // Inside a feature: ui → hooks → api → model. Other features only through their index.ts.
  allow('feature-ui', [
    layer('feature-ui', sameFeature),
    layer('feature-hooks', sameFeature),
    layer('feature-model', sameFeature),
    featureEntry,
    'shared-ui',
    'shared-lib',
    'shared-i18n',
    'shared-config',
  ]),
  allow('feature-hooks', [
    layer('feature-hooks', sameFeature),
    layer('feature-api', sameFeature),
    layer('feature-model', sameFeature),
    'shared-lib',
    'shared-i18n',
    'shared-config',
  ]),
  allow('feature-api', [
    layer('feature-api', sameFeature),
    layer('feature-model', sameFeature),
    'shared-api',
    'shared-lib',
  ]),
  allow('feature-model', [layer('feature-model', sameFeature), 'shared-lib']),
  // shared imports nothing from features, routes, or app.
  allow('shared-api', ['shared-api', 'shared-lib', 'shared-i18n', 'shared-config']),
  allow('shared-ui', ['shared-ui', 'shared-lib']),
  allow('shared-lib', ['shared-lib']),
  allow('shared-i18n', ['shared-i18n', 'shared-lib']),
  allow('shared-config', ['shared-config']),
  allow('test', ['test', 'app', 'routes', featureEntry, ...SHARED]),
  // Test files of any layer may use the shared test helpers.
  { from: { file: { categories: 'test-file' } }, allow: { to: layer('test') } },
];

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'playwright-report',
      'test-results',
      'src/app/routeTree.gen.ts',
      'src/shared/api/schema.gen.ts',
      'src/shared/ui/icons/icons.gen.ts',
      'src/shared/lib/countries.gen.ts',
    ],
  },

  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // TanStack Router's idiom: route guards and loaders `throw notFound()` and `throw redirect()`.
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [{ from: 'package', package: '@tanstack/router-core', name: ['NotFoundError', 'Redirect'] }],
        },
      ],
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y, boundaries },
    settings: {
      react: { version: 'detect' },
      'boundaries/elements': boundaryElements,
      'boundaries/files': [{ category: 'test-file', pattern: '**/*.test.{ts,tsx}' }],
      'boundaries/legacy-templates': false,
      'import/resolver': { typescript: { project: './tsconfig.app.json' } },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.strict.rules,

      // Copy comes only from the message files (ADR-003, "Localization").
      'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true, noAttributeStrings: false }],

      'boundaries/dependencies': ['error', { default: 'disallow', policies: boundaryPolicies }],
      'boundaries/no-unknown-files': 'error',

      // Only shared/api talks to openapi-fetch; only business-time handles date strings.
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'openapi-fetch', message: 'Use the client from shared/api.' }] },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length>0]",
          message: 'Parse and build dates only in shared/lib/business-time.ts.',
        },
        {
          selector: 'CallExpression[callee.property.name=/^toLocale/]',
          message: 'Format dates and times only in shared/lib/business-time.ts.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='parse']",
          message: 'Parse instants only in shared/lib/business-time.ts.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='UTC']",
          message: 'Build instants only in shared/lib/business-time.ts.',
        },
      ],
    },
  },

  { files: ['src/shared/api/**'], rules: { 'no-restricted-imports': 'off' } },
  {
    // model is pure TypeScript: no React, no data or routing libraries.
    files: ['src/features/*/model/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'openapi-fetch', message: 'Use the client from shared/api.' }],
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*', 'react-intl', '@tanstack/*'],
              message: 'features/*/model is pure TypeScript.',
            },
          ],
        },
      ],
    },
  },
  {
    // Only ui renders: hooks, api, and model hold no JSX.
    files: ['src/features/*/{hooks,api,model}/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'JSXElement, JSXFragment', message: 'Only features/*/ui renders JSX.' },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length>0]",
          message: 'Parse and build dates only in shared/lib/business-time.ts.',
        },
        {
          selector: 'CallExpression[callee.property.name=/^toLocale/]',
          message: 'Format dates and times only in shared/lib/business-time.ts.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='parse']",
          message: 'Parse instants only in shared/lib/business-time.ts.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='UTC']",
          message: 'Build instants only in shared/lib/business-time.ts.',
        },
      ],
    },
  },
  { files: ['src/shared/lib/business-time.ts'], rules: { 'no-restricted-syntax': 'off' } },
  {
    // Test files: fixtures may hold literal copy, and the file layout rules do not apply.
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: { 'react/jsx-no-literals': 'off' },
  },
);
