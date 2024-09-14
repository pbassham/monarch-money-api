import globals from "globals"
import pluginJs from "@eslint/js"

export default [
  {
    languageOptions: { globals: globals.browser },
    env: {
      node: true,
      // other environments, e.g., "browser": true if needed
    },
  },
  pluginJs.configs.recommended,
]
