import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  { ignores: ["services/**/.venv/**", "services/**/.pytest_cache/**", "services/**/__pycache__/**"] },
  ...nextVitals,
  ...nextTs,
]);

export default eslintConfig;
