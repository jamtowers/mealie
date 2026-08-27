/**
 * Mocks `window.location` for test environments.
 *
 * Call this once per test in `beforeEach` or at the top of a `beforeAll`.
 *
 * ```ts
 * beforeEach(() => {
 *   mockLocation("http://localhost/recipes");
 * });
 * ```
 */
export function mockLocation(href = "http://localhost/"): typeof window.location {
  const url = new URL(href);

  const location = {
    href,
    origin: url.origin,
    hostname: url.hostname,
    pathname: url.pathname,
    hash: url.hash,
    search: url.search,
    protocol: url.protocol,
    host: url.host,
    port: url.port,
    ancestorOrigins: {} as DOMStringList,
    getSearch: () => url.search,
    assign: () => {
      return;
    },
    reload: () => {
      return;
    },
    replace: () => {
      return;
    },
  } as unknown as typeof window.location;

  Object.defineProperty(window, "location", {
    value: location,
    configurable: true,
    writable: true,
  });

  return location;
}
