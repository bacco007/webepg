module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:tailwindcss/recommended',
    'prettier',
    // 'plugin:unicorn/recommended',
  ],
  plugins: ['simple-import-sort', 'prettier', '@typescript-eslint', 'unicorn'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
      { usePrettierrc: true },
    ],
    'unicorn/better-regex': 'error',
    'unicorn/filename-case': 'off',
    'sort-imports': 'off',
    'tailwindcss/no-custom-classname': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-empty-object-type': 'warn',
    'simple-import-sort/imports': 'warn',
    'prettier/prettier': 'warn',
    'simple-import-sort/imports': [
      2,
      {
        groups: [
          ['^.+\\.s?css$'],
          [`^(${require('module').builtinModules.join('|')})(/|$)`, '^react', '^@?\\w'],
          ['^components(/.*|$)'],
          ['^lib(/.*|$)', '^hooks(/.*|$)'],
          ['^\\.'],
        ],
      },
    ],
  },
  settings: {
    tailwindcss: {
      callees: ['cn'],
      config: 'tailwind.config.js',
    },
  },
};
