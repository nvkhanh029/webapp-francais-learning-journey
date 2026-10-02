import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/", "node_modules/", "coverage/"] },
  { settings: { react: { version: "detect" } } },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: { globals: globals.browser },
    rules: {
      // Props are not type-checked with PropTypes in this project.
      "react/prop-types": "off",
    },
  },
  {
    files: ["*.js"],
    languageOptions: { globals: globals.node },
  },
];
