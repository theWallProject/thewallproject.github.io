import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Bundle Analysis", () => {
  test("should have optimized JavaScript bundle size", async () => {
    const distPath = path.join(process.cwd(), "dist");
    const assetsPath = path.join(distPath, "assets");

    // Check if dist directory exists
    expect(fs.existsSync(distPath)).toBe(true);
    expect(fs.existsSync(assetsPath)).toBe(true);

    // Find JavaScript files
    const jsFiles = fs
      .readdirSync(assetsPath)
      .filter((file) => file.endsWith(".js"))
      .map((file) => ({
        name: file,
        path: path.join(assetsPath, file),
        size: fs.statSync(path.join(assetsPath, file)).size,
      }));

    // Should have at least one JS file
    expect(jsFiles.length).toBeGreaterThan(0);

    // Check total JavaScript size
    const totalJsSize = jsFiles.reduce((sum, file) => sum + file.size, 0);

    // Total JS should be under 500KB (gzipped will be much smaller)
    expect(totalJsSize).toBeLessThan(500 * 1024);

    // Individual JS files should be reasonable size
    jsFiles.forEach((file) => {
      expect(file.size).toBeLessThan(300 * 1024); // 300KB per file
    });

    console.log(`JavaScript bundle analysis:`);
    jsFiles.forEach((file) => {
      console.log(`  ${file.name}: ${(file.size / 1024).toFixed(1)}KB`);
    });
    console.log(`  Total: ${(totalJsSize / 1024).toFixed(1)}KB`);
  });

  test("should have optimized CSS bundle size", async () => {
    const distPath = path.join(process.cwd(), "dist");
    const assetsPath = path.join(distPath, "assets");

    // Find CSS files
    const cssFiles = fs
      .readdirSync(assetsPath)
      .filter((file) => file.endsWith(".css"))
      .map((file) => ({
        name: file,
        path: path.join(assetsPath, file),
        size: fs.statSync(path.join(assetsPath, file)).size,
      }));

    // Should have at least one CSS file
    expect(cssFiles.length).toBeGreaterThan(0);

    // Check total CSS size
    const totalCssSize = cssFiles.reduce((sum, file) => sum + file.size, 0);

    // Total CSS should be under 100KB
    expect(totalCssSize).toBeLessThan(100 * 1024);

    // Individual CSS files should be reasonable size
    cssFiles.forEach((file) => {
      expect(file.size).toBeLessThan(50 * 1024); // 50KB per file
    });

    console.log(`CSS bundle analysis:`);
    cssFiles.forEach((file) => {
      console.log(`  ${file.name}: ${(file.size / 1024).toFixed(1)}KB`);
    });
    console.log(`  Total: ${(totalCssSize / 1024).toFixed(1)}KB`);
  });

  test("should have optimized HTML file size", async () => {
    const distPath = path.join(process.cwd(), "dist");
    const htmlPath = path.join(distPath, "index.html");

    // Check if HTML file exists
    expect(fs.existsSync(htmlPath)).toBe(true);

    // Get HTML file size
    const htmlSize = fs.statSync(htmlPath).size;

    // HTML should be under 10KB
    expect(htmlSize).toBeLessThan(10 * 1024);

    // Read HTML content for analysis
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    // Should have proper meta tags
    expect(htmlContent).toContain('<meta charset="UTF-8" />');
    expect(htmlContent).toContain('<meta name="viewport"');

    // Should have proper title
    expect(htmlContent).toContain("<title>");

    // Should have proper favicon
    expect(htmlContent).toContain('rel="icon"');

    console.log(`HTML file size: ${(htmlSize / 1024).toFixed(1)}KB`);
  });

  test("should have optimized image assets", async () => {
    const filesPath = path.join(process.cwd(), "files");

    if (fs.existsSync(filesPath)) {
      const imageFiles = [];

      // Recursively find image files
      const findImages = (dir: string) => {
        const items = fs.readdirSync(dir);
        items.forEach((item) => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            findImages(fullPath);
          } else if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(item)) {
            imageFiles.push({
              name: item,
              path: fullPath,
              size: stat.size,
            });
          }
        });
      };

      findImages(filesPath);

      if (imageFiles.length > 0) {
        console.log(`Image assets analysis:`);

        // Check individual image sizes
        imageFiles.forEach((file) => {
          // PNG/JPG should be under 500KB
          if (/\.(png|jpg|jpeg)$/i.test(file.name)) {
            expect(file.size).toBeLessThan(500 * 1024);
          }

          // SVG should be under 100KB
          if (/\.svg$/i.test(file.name)) {
            expect(file.size).toBeLessThan(100 * 1024);
          }

          console.log(`  ${file.name}: ${(file.size / 1024).toFixed(1)}KB`);
        });

        // Total image size should be reasonable
        const totalImageSize = imageFiles.reduce(
          (sum, file) => sum + file.size,
          0
        );
        expect(totalImageSize).toBeLessThan(2 * 1024 * 1024); // 2MB total

        console.log(`  Total images: ${(totalImageSize / 1024).toFixed(1)}KB`);
      }
    }
  });

  test("should have proper asset optimization", async () => {
    const distPath = path.join(process.cwd(), "dist");
    const assetsPath = path.join(distPath, "assets");

    // Check for source maps (should be present in development builds)
    const sourceMapFiles = fs
      .readdirSync(assetsPath)
      .filter((file) => file.endsWith(".map"));

    // Should have source maps for debugging
    expect(sourceMapFiles.length).toBeGreaterThan(0);

    // Check for gzipped size estimation
    const jsFiles = fs
      .readdirSync(assetsPath)
      .filter((file) => file.endsWith(".js"))
      .map((file) => ({
        name: file,
        size: fs.statSync(path.join(assetsPath, file)).size,
      }));

    // Estimate gzipped size (roughly 30% of original size)
    const estimatedGzippedSize = jsFiles.reduce(
      (sum, file) => sum + file.size * 0.3,
      0
    );

    // Estimated gzipped size should be under 150KB
    expect(estimatedGzippedSize).toBeLessThan(150 * 1024);

    console.log(
      `Estimated gzipped JavaScript size: ${(
        estimatedGzippedSize / 1024
      ).toFixed(1)}KB`
    );
  });
});
