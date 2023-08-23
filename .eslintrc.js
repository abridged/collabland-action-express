module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "prettier",
    "plugin:@typescript-eslint/recommended",
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {},
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  ignorePatterns: ["dist/**"],
};
