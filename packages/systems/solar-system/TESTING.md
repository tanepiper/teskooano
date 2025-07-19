# Solar System Testing

This package uses Vitest with Playwright for browser-based testing in headless Chrome.

## Test Setup

The tests are configured to run in a browser environment using Playwright with headless Chrome. This allows testing of browser-specific APIs and DOM manipulation if needed.

## Running Tests

### Using Moon (Recommended)

```bash
# Run all tests
moon run solar-system:test

# Run tests with UI (interactive)
moon run solar-system:test:ui

# Run tests with coverage
moon run solar-system:test:coverage

# Run tests in watch mode
moon run solar-system:test:watch

# Run tests in browser mode
moon run solar-system:test:browser
```

### Using NPM

```bash
# Run all tests
npm test

# Run tests with UI (interactive)
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests in browser mode
npm run test:browser
```

### Using the Test Runner Script

```bash
# Make executable and run
chmod +x test-runner.js
./test-runner.js
```

## Test Structure

- `src/index.spec.ts` - Main solar system initialization tests
- `src/earth/earth.spec.ts` - Earth and Moon specific tests
- Additional test files can be added in subdirectories following the `.spec.ts` naming convention

## Configuration

The test configuration is in `vitest.config.ts` and includes:

- **Environment**: jsdom for DOM simulation
- **Browser**: Playwright with headless Chrome
- **Aliases**: Path mappings for internal packages
- **Coverage**: Built-in coverage reporting

## Browser Testing

Tests run in a headless Chrome browser environment, which allows for:

- Testing browser-specific APIs
- DOM manipulation testing
- Real browser behavior simulation
- Performance testing in a real browser context

## Debugging

To debug tests:

1. Use `npm run test:ui` for interactive testing
2. Add `debugger;` statements in test code
3. Use `console.log()` for debugging output
4. Check browser console for any errors

## Continuous Integration

The tests are configured to run in CI environments with:

- Headless browser execution
- Coverage reporting
- Proper exit codes for CI systems
