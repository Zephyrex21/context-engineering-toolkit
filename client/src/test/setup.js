import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement matchMedia — every real browser does. Polyfilled
// here so ThemeContext's system-preference check doesn't crash in tests.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

// Most components ping a /status endpoint on mount. Default to a benign
// response so component tests aren't all forced to mock fetch just to
// render — individual tests override this when the response matters.
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ available: false, provider: null }),
    })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});
