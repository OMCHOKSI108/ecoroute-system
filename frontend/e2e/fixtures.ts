import { test as base, expect, Page } from '@playwright/test';

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const pageErrors: Error[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore browser network resource status logs for expected HTTP errors and benign assets
        if (
          !text.includes('favicon.ico') &&
          !text.includes('Failed to load resource:') &&
          !text.includes('status of 401') &&
          !text.includes('status of 404') &&
          !text.includes('status of 400') &&
          !text.includes('status of 409')
        ) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('response', (response) => {
      if (response.url().includes('/api/v1/') && response.status() >= 500) {
        throw new Error(`Unexpected 500 Server Error on ${response.url()}`);
      }
    });

    await use(page);

    if (pageErrors.length > 0) {
      throw new Error(`Uncaught page error(s):\n${pageErrors.map((e) => e.stack || e.message).join('\n')}`);
    }
    if (consoleErrors.length > 0) {
      throw new Error(`Uncaught console.error(s):\n${consoleErrors.join('\n')}`);
    }
  },
});

export { expect };
