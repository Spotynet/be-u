import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='select']",
          message:
            "Usa CustomDropdown (web/components/ui/CustomDropdown.tsx). Ver DesignSystem > Dropdowns.",
        },
        {
          selector: "JSXOpeningElement[name.name='option']",
          message:
            "Usa CustomDropdown (web/components/ui/CustomDropdown.tsx). Ver DesignSystem > Dropdowns.",
        },
      ],
    },
  },
];

export default eslintConfig;
