# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## Adding a New Language

When adding a new supported language, several files need to be updated to keep everything in sync. The TypeScript build will catch missing entries, but here is the full checklist:

### 1. Translations (`src/locales/translations.ts`)

Add the new language code to every translation key's object. Each key has entries for all supported languages (e.g. `en`, `ar`, `fr`, etc.). Missing any key will cause a TypeScript error since the type enforces completeness.

### 2. Supported Languages Type (`src/types/translations.ts`)

Add the new language code to the `SupportedLanguages` union type and to the `SUPPORTED_LANGUAGES` const object with `code`, `name`, `nativeName`, and `isRTL` fields.

### 3. App Store Badge (`src/components/badgeAssets.ts`)

Add the new language code to `APPSTORE_BADGE_PATHS`, mapping it to the badge SVG path:

```
xx: "/files/common/appstore/appstore-badge-xx.svg"
```

**TypeScript will error at build time** if this entry is missing, since `APPSTORE_BADGE_PATHS` is typed as `Record<SupportedLanguages, string>`.

### 4. App Store Badge SVG File

Download the localized "Download on the App Store" badge from [Apple's marketing resources](https://developer.apple.com/app-store/marketing/guidelines/#section-badges) (white/`wht` variant for our dark-themed site). Place it at:

```
public/files/common/appstore/appstore-badge-xx.svg
```

Where `xx` matches the language code used in `APPSTORE_BADGE_PATHS`.

### 5. i18n Locale JSON (`src/locales/generated/`)

Run `npm run generate-i18n` to regenerate the locale JSON files from `translations.ts`. This will create/update `src/locales/generated/xx.json` automatically.

### 6. Verify Build

Run `npm run build` to confirm everything compiles. TypeScript will catch:

- Missing translation keys in `translations.ts`
- Missing `SupportedLanguages` entries
- Missing `APPSTORE_BADGE_PATHS` entries
- Missing locale JSON files (via `generate-i18n`)
