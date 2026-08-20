/**
 * Mocks `window.localStorage` for test environments.
 *
 * Call this once per test in `beforeEach` or at the top of a `beforeAll`.
 * Returns the backing storage object so tests can inspect or mutate values
 * directly without going through the mock API.
 *
 * ```ts
 * beforeEach(() => {
 *   mockLocalStorage();
 *   localStorage.clear();
 * });
 * ```
 */
export function mockLocalStorage(): Record<string, string> {
  const storage: Record<string, string> = {};

  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((key) => delete storage[key]);
      },
    },
    configurable: true,
    writable: true,
  });

  return storage;
}
