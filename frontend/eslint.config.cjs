const { FlatCompat } = require("@eslint/eslintrc");
const { defineConfig, globalIgnores } = require("eslint/config");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/js/**",
    "eslint.config.cjs",
    "next.config.js",
    "postcss.config.mjs",
  ]),
]);
