# Playwright Test Suite

This directory contains comprehensive end-to-end tests for The Wall project using Playwright with TypeScript.

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── app.spec.ts         # Application-wide tests
│   ├── navigation.spec.ts  # Navigation and routing tests
│   ├── header.spec.ts      # Header component tests
│   ├── language-switcher.spec.ts  # Language switching tests
│   ├── downloads.spec.ts   # Downloads section tests
│   ├── newsletter.spec.ts  # Newsletter component tests
│   ├── hero.spec.ts        # Hero section tests
│   ├── features.spec.ts    # Features section tests
│   ├── footer.spec.ts      # Footer component tests
│   ├── privacy-policy.spec.ts  # Privacy policy page tests
│   ├── browser-detection.spec.ts  # Browser detection tests
│   └── internationalization.spec.ts  # i18n tests
├── utils/
│   └── test-helpers.ts     # Test utility functions
├── global-setup.ts         # Global test setup
└── README.md              # This file
```

## Test Commands

### Basic Commands

- `npm test` - Run all tests
- `npm run test:ui` - Run tests with Playwright UI
- `npm run test:headed` - Run tests in headed mode (visible browser)
- `npm run test:debug` - Run tests in debug mode
- `npm run test:report` - Show test report
- `npm run test:install` - Install Playwright browsers

### Advanced Commands

- `npm run test -- --project=chromium` - Run tests only in Chromium
- `npm run test -- --project=firefox` - Run tests only in Firefox
- `npm run test -- --project=webkit` - Run tests only in WebKit
- `npm run test -- --headed` - Run tests with visible browser
- `npm run test -- --workers=1` - Run tests with single worker
- `npm run test -- --reporter=html` - Generate HTML report

## Test Features

### Cross-Browser Testing

Tests run on multiple browsers:

- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari

### Responsive Testing

Tests include multiple viewport sizes:

- Desktop (1920x1080, 1366x768)
- Tablet (768x1024)
- Mobile (375x667, 320x568)

### Accessibility Testing

- ARIA attributes validation
- Keyboard navigation
- Screen reader compatibility
- Alt text for images
- Proper heading hierarchy

### Performance Testing

- Page load times
- Interaction responsiveness
- Memory usage monitoring
- Network request optimization

### Internationalization Testing

- Language switching functionality
- RTL language support
- Translation accuracy
- Browser language detection

## Test Categories

### 1. Navigation Tests (`navigation.spec.ts`)

- Page routing
- URL handling
- Browser navigation
- 404 error handling

### 2. Component Tests

- **Header** (`header.spec.ts`): Logo, title, scroll behavior
- **Language Switcher** (`language-switcher.spec.ts`): Dropdown, keyboard nav, accessibility
- **Downloads** (`downloads.spec.ts`): Download links, browser detection, responsive design
- **Newsletter** (`newsletter.spec.ts`): MailerLite integration, form loading
- **Hero** (`hero.spec.ts`): Content display, responsive layout
- **Features** (`features.spec.ts`): Feature items, icons, descriptions
- **Footer** (`footer.spec.ts`): Links, content, positioning

### 3. Page Tests

- **Privacy Policy** (`privacy-policy.spec.ts`): Content, navigation, accessibility

### 4. Feature Tests

- **Browser Detection** (`browser-detection.spec.ts`): Bowser integration, fallbacks
- **Internationalization** (`internationalization.spec.ts`): i18next, language switching

### 5. Application Tests (`app.spec.ts`)

- Overall application functionality
- Cross-component integration
- Performance and stability

## Test Utilities

The `TestHelpers` class provides common testing functions:

```typescript
import { TestHelpers } from "../utils/test-helpers";

// Wait for page load
await TestHelpers.waitForPageLoad(page);

// Change language
await TestHelpers.changeLanguage(page, 1);

// Check element visibility
await TestHelpers.checkElementVisibility(page, "header");

// Test responsive viewport
await TestHelpers.testResponsiveViewport(page, { width: 768, height: 1024 });

// Mock browser detection
await TestHelpers.mockBrowserDetection(page, "Chrome");
```

## Best Practices

### 1. Test Organization

- Group related tests using `test.describe()`
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Selectors

- Use semantic selectors when possible
- Prefer data attributes over CSS classes
- Use role-based selectors for accessibility

### 3. Assertions

- Use specific assertions
- Check both positive and negative cases
- Validate content, not just presence

### 4. Performance

- Minimize wait times
- Use proper waiting strategies
- Avoid unnecessary page reloads

### 5. Reliability

- Handle flaky elements gracefully
- Use proper error handling
- Clean up test state

## Configuration

The test configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests`
- **Parallel Execution**: Enabled
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML, JSON, JUnit
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry

## Continuous Integration

Tests are configured for CI environments:

- Single worker mode
- Forbid-only mode
- Retry on failure
- Artifact collection

## Debugging

### Debug Mode

```bash
npm run test:debug
```

### UI Mode

```bash
npm run test:ui
```

### Screenshots

Screenshots are automatically taken on test failure and saved to `test-results/`.

### Videos

Videos are recorded for failed tests and saved to `test-results/`.

### Traces

Traces are generated for failed tests and can be viewed with:

```bash
npx playwright show-trace trace.zip
```

## Adding New Tests

1. Create a new test file in `tests/e2e/`
2. Import test utilities if needed
3. Use descriptive test names
4. Follow the existing patterns
5. Add appropriate assertions
6. Test both positive and negative cases

## Maintenance

- Run tests regularly
- Update selectors when UI changes
- Monitor test performance
- Review and update test coverage
- Keep dependencies updated

## Troubleshooting

### Common Issues

1. **Element not found**: Check if selector is still valid
2. **Timing issues**: Use proper wait strategies
3. **Flaky tests**: Add retry logic or improve selectors
4. **Performance issues**: Optimize test execution

### Debug Commands

```bash
# Run specific test file
npm test -- tests/e2e/navigation.spec.ts

# Run specific test
npm test -- -g "should navigate to home page"

# Run with verbose output
npm test -- --verbose
```
