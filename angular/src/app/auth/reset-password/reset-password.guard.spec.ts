import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, RedirectCommand, Router, RouterStateSnapshot, UrlTree } from "@angular/router";

import type { Mock } from "vitest";

import { resetPasswordGuard } from "./reset-password.guard";

const mockState = {} as RouterStateSnapshot;

describe("resetPasswordGuard", () => {
  let mockRoute: ActivatedRouteSnapshot;
  let parseUrl: Mock<(url: string) => UrlTree>;

  beforeEach(() => {
    mockRoute = { queryParams: {} } as ActivatedRouteSnapshot;
    parseUrl = vi.fn(() => ({}) as UrlTree);

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { parseUrl } }],
    });
  });

  it("should allow navigation when the token is present", async () => {
    mockRoute.queryParams = { token: "abc123" };
    const result = await TestBed.runInInjectionContext(() => resetPasswordGuard(mockRoute, mockState));
    expect(result).toBe(true);
    expect(parseUrl).not.toHaveBeenCalled();
  });

  it("should redirect to /login when the token is missing", async () => {
    const loginUrl = {} as UrlTree;
    parseUrl.mockReturnValue(loginUrl);
    const result = await TestBed.runInInjectionContext(() => resetPasswordGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(RedirectCommand);
    const command = result as RedirectCommand;
    expect(command.redirectTo).toBe(loginUrl);
    expect(command.navigationBehaviorOptions).toEqual({ replaceUrl: true });
    expect(parseUrl).toHaveBeenCalledWith("/login");
  });

  it("should redirect to /login when the token is empty", async () => {
    mockRoute.queryParams = { token: "" };
    const result = await TestBed.runInInjectionContext(() => resetPasswordGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(RedirectCommand);
    expect(parseUrl).toHaveBeenCalledWith("/login");
  });
});
