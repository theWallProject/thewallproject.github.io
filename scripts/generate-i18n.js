import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, "../src/locales/generated");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ── Step 1: Generate JSON files from translations.ts ───────────────
const translationsPath = path.join(__dirname, "../src/locales/translations.ts");
const content = fs.readFileSync(translationsPath, "utf8");

// Remove TypeScript-specific syntax to make it evaluable
let jsContent = content
  .replace(/export const translations = /, "const translations = ")
  .replace(/} as const;/, "};")
  .replace(/\/\/ Type for translation keys[\s\S]*$/, "");

// Use Function constructor to evaluate
const fn = new Function(jsContent + "\nreturn translations;");
const translations = fn();

const requiredLanguages = [
  "en",
  "ar",
  "fr",
  "es",
  "de",
  "id",
  "nl",
  "zh_CN",
  "zh_TW",
];

// Convert flat keys like "meta.title" to nested objects like { meta: { title: "..." } }
function setNestedValue(obj, flatKey, value) {
  const parts = flatKey.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

// Generate a JSON file per language
for (const lang of requiredLanguages) {
  const nested = { translation: {} };

  for (const [flatKey, langValues] of Object.entries(translations)) {
    const value = langValues[lang];
    if (value !== undefined) {
      setNestedValue(nested.translation, flatKey, value);
    }
  }

  const filePath = path.join(outputDir, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(nested, null, 2) + "\n");
  console.log(`Generated: ${filePath}`);
}

// ── Step 2: Generate index.ts barrel file ──────────────────────────
const indexContent = `// Auto-generated from JSON files
// Do not edit manually - run 'npm run generate-i18n' to regenerate

${requiredLanguages
  .map(
    (lang) => `import ${lang} from './${lang}.json' assert { type: 'json' };`
  )
  .join("\n")}

export const resources = {
${requiredLanguages.map((lang) => `  ${lang}`).join(",\n")}
} as const;

export default resources;
`;

fs.writeFileSync(path.join(outputDir, "index.ts"), indexContent);
console.log(`Generated: ${path.join(outputDir, "index.ts")}`);

console.log(
  `\n✅ i18n resources generated successfully from translations.ts!`
);
console.log(`📁 Generated ${requiredLanguages.length} language files`);
