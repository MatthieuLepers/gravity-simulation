module.exports = {
  root: true,
  env: {
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: 'latest',
    project: ['tsconfig.json'],
    extraFileExtensions: ['.wgsl'],
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'simple-import-sort',
    'unused-imports',
    'wgsl',
  ],
  overrides: [
    {
      files: ["**/*.wgsl"],
      parser: "eslint-plugin-wgsl/parser",
      rules: {
        "wgsl/valid-wgsl": "error",
      },
    },
    {
      files: ["**/*.{js,ts,jsx,tsx}"],
      rules: {
        "wgsl/valid-wgsl-template": "error",
      },
    },
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'tsconfig.json',
      },
      node: {
        extensions: ['.js', '.ts', '.json'],
      },
    },
  },
  rules: {
    'import/extensions': ['error', 'always', {
      js: 'never',
      ts: 'never',
      jsx: 'never',
      tsx: 'never',
    }],
    'import/prefer-default-export': 'off',
    'import/no-cycle': 'off',
    'simple-import-sort/imports': ['error', {
      groups: [
        // 1. Packages externes (node_modules)
        ['^@?\\w'],
        // 2. Vue components (.vue uniquement)
        ['^@/.+\\.vue$'],
        // 3. core métier & store de composants
        ['^@/core', '^@/components/(?!.*\\.vue$)', '^@/composables/.+'],
        // 4. reste du projet
        ['^@/'],
        // 5. relatifs
        ['^\\.'],
      ],
    }],
    'simple-import-sort/exports': 'error',
    'unused-imports/no-unused-imports': 'error',
    'no-param-reassign': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'class-methods-use-this': 'off',
    'func-names': 'off',
    'linebreak-style': ['error', 'unix'],
    'max-len': ['error', {
      code: 512,
      tabWidth: 2,
      ignorePattern: 'd="([\\s\\S]*?)"',
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
    'object-curly-newline': ['error', {
      ImportDeclaration: {
        multiline: true,
        minProperties: 4,
      },
    }],
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    "@typescript-eslint/no-empty-object-type": ['error', {
      allowInterfaces: 'always',
      allowObjectTypes: 'always',
    }],
  },
};
