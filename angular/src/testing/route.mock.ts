import { ActivatedRouteSnapshot, RouterStateSnapshot, type Params, type UrlTree } from "@angular/router";
import { vi, type Mock } from "vitest";

/**
 * Mock `ActivatedRouteSnapshot` for guard tests.
 * Pass `params`/`queryParams` to shape the route per test.
 */
export function mockActivatedRoute(
  options: { params?: Params; queryParams?: Record<string, string> } = {},
): ActivatedRouteSnapshot {
  return {
    params: options.params ?? {},
    queryParams: options.queryParams ?? {},
  } as ActivatedRouteSnapshot;
}

/** Mock `RouterStateSnapshot` for guard tests. */
export function mockRouterState(): RouterStateSnapshot {
  return {} as RouterStateSnapshot;
}

/** `Router.parseUrl` spy for guard tests. */
export function mockParseUrl(): Mock<(url: string) => UrlTree> {
  return vi.fn(() => ({}) as UrlTree);
}
