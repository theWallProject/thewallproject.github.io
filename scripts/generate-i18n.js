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

// Check if JSON files already exist
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
const missingFiles = [];

requiredLanguages.forEach((lang) => {
  const filePath = path.join(outputDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(lang);
  }
});

if (missingFiles.length > 0) {
  console.error(`❌ Missing translation files: ${missingFiles.join(", ")}`);
  console.error(
    "Please ensure all translation files exist in src/locales/generated/"
  );
  process.exit(1);
}

// Generate index file that exports all resources
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

console.log("✅ i18n resources verified successfully!");
console.log(`📁 Found ${requiredLanguages.length} language files`);
