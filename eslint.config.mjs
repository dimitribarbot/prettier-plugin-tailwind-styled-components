import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  prettier,
  globalIgnores(["node_modules/**", "dist/**"])
]);

export default eslintConfig;
