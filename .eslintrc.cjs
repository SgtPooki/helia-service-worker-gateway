module.exports = {
  // extends: 'standard-with-typescript',
  // parserOptions: {
  //   project: './tsconfig.json'
  // }

  'root': true,
  'extends': [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'standard-with-typescript'
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': { 'project': ['./tsconfig.json'] },
  'plugins': [
      '@typescript-eslint'
  ],
  'rules': {
    "@typescript-eslint/restrict-template-expressions": "off",
    "eqeqeq": ["error", "always", {"null": "ignore"}],
      // '@typescript-eslint/strict-boolean-expressions': [
      //     2,
      //     {
      //         'allowString' : false,
      //         'allowNumber' : false
      //     }
      // ]
  },
  'ignorePatterns': ['src/**/*.test.ts', 'src/frontend/generated/*']
}
