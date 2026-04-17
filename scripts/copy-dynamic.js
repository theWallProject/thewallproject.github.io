import { cpSync, copyFileSync } from "fs";

cpSync("src/dynamic", "dist/dynamic", { recursive: true });
copyFileSync(".htaccess", "dist/.htaccess");
console.log("Copied src/dynamic to dist/dynamic and .htaccess to dist");

copyFileSync(".htaccess", "dist/.htaccess");
console.log("Copied .htaccess to dist/.htaccess");
