import path from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "@typescript-eslint/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname
});

const config = [
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/out/**", "**/dist/**"]
  },
  ...compat.extends("next/core-web-vitals"),
  {
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off"
    }
  }
];

export default config;
