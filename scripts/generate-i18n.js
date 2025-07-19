import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the TypeScript translations file
const translationsPath = path.join(__dirname, "../src/locales/translations.ts");
const outputDir = path.join(__dirname, "../src/locales/generated");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read and parse the translations file
const translationsContent = fs.readFileSync(translationsPath, "utf8");

// Extract the translations object using regex
const translationsMatch = translationsContent.match(
  /export const translations = ({[\s\S]*?}) as const;/
);
if (!translationsMatch) {
  console.error("Could not find translations object in file");
  process.exit(1);
}

// Convert the TypeScript object to JavaScript using a more robust approach
let translationsStr = translationsMatch[1];

// Step 1: Temporarily replace problematic patterns
translationsStr = translationsStr
  .replace(/\{\{(\w+)\}\}/g, "INTERPOLATION_$1_INTERPOLATION")
  .replace(/:\s*"([^"]*Current[^"]*)"/g, ': "CURRENT_PLACEHOLDER"')
  .replace(/:\s*"([^"]*currently[^"]*)"/g, ': "CURRENTLY_PLACEHOLDER"');

// Step 2: Convert keys to quoted strings
translationsStr = translationsStr.replace(/(\w+):\s*{/g, '"$1": {');
translationsStr = translationsStr.replace(/(\w+):\s*"/g, '"$1": "');
translationsStr = translationsStr.replace(/(\w+):\s*\[/g, '"$1": [');

// Step 3: Clean up trailing commas and formatting
translationsStr = translationsStr
  .replace(/,(\s*})/g, "$1")
  .replace(/,(\s*])/g, "$1")
  .replace(/,\s*}/g, "}")
  .replace(/,\s*]/g, "]");

// Step 4: Restore the original content
translationsStr = translationsStr
  .replace(/INTERPOLATION_(\w+)_INTERPOLATION/g, "{{$1}}")
  .replace(/"CURRENT_PLACEHOLDER"/g, '"Select language. Current: {{language}}"')
  .replace(/"CURRENTLY_PLACEHOLDER"/g, '"{{language}} is currently selected"');

let translations;
try {
  // Use Function constructor instead of eval for better security
  translations = new Function(`return ${translationsStr}`)();
} catch (error) {
  console.error("Error parsing translations:", error);
  console.error(
    "Problematic string:",
    translationsStr.substring(0, 500) + "..."
  );
  process.exit(1);
}

// Convert flat structure to nested format
const convertToNestedFormat = (flatTranslations) => {
  const nestedResources = {};

  // Get all unique languages from the first translation
  const languages = Object.keys(Object.values(flatTranslations)[0] || {});

  // Initialize resources for each language
  languages.forEach((lang) => {
    nestedResources[lang] = { translation: {} };
  });

  // Convert flat structure to nested
  Object.entries(flatTranslations).forEach(([key, langValues]) => {
    const keys = key.split(".");
    Object.entries(langValues).forEach(([lang, value]) => {
      if (nestedResources[lang]) {
        let current = nestedResources[lang].translation;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      }
    });
  });

  return nestedResources;
};

const nestedResources = convertToNestedFormat(translations);

// Generate individual language files
Object.entries(nestedResources).forEach(([lang, resource]) => {
  const filePath = path.join(outputDir, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(resource, null, 2));
  console.log(`Generated: ${filePath}`);
});

// Generate index file that exports all resources
const indexContent = `// Auto-generated from flat translations
// Do not edit manually - run 'npm run generate-i18n' to regenerate

${Object.entries(nestedResources)
  .map(
    ([lang, resource]) =>
      `import ${lang} from './${lang}.json' assert { type: 'json' };`
  )
  .join("\n")}

export const resources = {
${Object.keys(nestedResources)
  .map((lang) => `  ${lang}`)
  .join(",\n")}
} as const;

export default resources;
`;

fs.writeFileSync(path.join(outputDir, "index.ts"), indexContent);
console.log(`Generated: ${path.join(outputDir, "index.ts")}`);

console.log("✅ i18n resources generated successfully!");
