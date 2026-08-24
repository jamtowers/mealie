import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, RedirectCommand, Router, RouterStateSnapshot, UrlTree } from "@angular/router";

import type { Mock } from "vitest";

import type { AppInfo } from "@api/models/app-info";
import { AppInfoService } from "@utils/app-info.service";

import { AuthService, PENDING_REDIRECT_STORAGE_KEY } from "../auth.service";
import { loginGuard } from "./login.guard";

const mockRoute = { queryParams: {} } as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

describe("loginGuard", () => {
  let status$: Mock<() => "loading" | "authenticated" | "unauthenticated">;
  let oauthSignIn: Mock<() => Promise<void>>;
  let startOidcFlow: Mock<() => void>;
  let info$: Mock<() => AppInfo | null>;
  let parseUrl: Mock<(url: string) => UrlTree>;

  beforeEach(() => {
    sessionStorage.clear();
    mockRoute.queryParams = {};

    status$ = vi.fn(() => "loading");
    oauthSignIn = vi.fn(() => Promise.resolve());
    startOidcFlow = vi.fn();
    info$ = vi.fn(() => null);
    parseUrl = vi.fn(() => ({}) as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { status$, user$: vi.fn(), oauthSignIn, startOidcFlow },
        },
        { provide: AppInfoService, useValue: { info$ } },
        { provide: Router, useValue: { parseUrl } },
      ],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("should redirect to / when authenticated", async () => {
    status$.mockReturnValue("authenticated");
    const homeUrl = {} as UrlTree;
    parseUrl.mockReturnValue(homeUrl);
    const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));
    expect(result).toBe(homeUrl);
    expect(parseUrl).toHaveBeenCalledWith("/");
  });

  it("should allow navigation when unauthenticated", async () => {
    status$.mockReturnValue("unauthenticated");
    const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should allow navigation when loading", async () => {
    const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  describe("oidc callback", () => {
    beforeEach(() => {
      mockRoute.queryParams = { code: "abc", state: "xyz" };
    });

    function markAuthenticatedAfterSignIn() {
      oauthSignIn.mockImplementation(async () => {
        status$.mockReturnValue("authenticated");
      });
    }

    it("should finish the login and redirect to the pending target, consuming it", async () => {
      sessionStorage.setItem(PENDING_REDIRECT_STORAGE_KEY, "/recipes");
      markAuthenticatedAfterSignIn();
      const pendingUrl = {} as UrlTree;
      parseUrl.mockReturnValue(pendingUrl);

      const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));

      expect(oauthSignIn).toHaveBeenCalledOnce();
      expect(result).toBe(pendingUrl);
      expect(parseUrl).toHaveBeenCalledWith("/recipes");
      expect(sessionStorage.getItem(PENDING_REDIRECT_STORAGE_KEY)).toBeNull();
    });

    it("should finish the login and redirect to / when there is no pending target", async () => {
      markAuthenticatedAfterSignIn();
      const homeUrl = {} as UrlTree;
      parseUrl.mockReturnValue(homeUrl);

      const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));

      expect(oauthSignIn).toHaveBeenCalledOnce();
      expect(result).toBe(homeUrl);
      expect(parseUrl).toHaveBeenCalledWith("/");
    });

    it("should clear the pending target and bounce to ?direct=1 on failure", async () => {
      oauthSignIn.mockRejectedValue(new Error("denied"));
      sessionStorage.setItem(PENDING_REDIRECT_STORAGE_KEY, "/recipes");
      const loginUrl = {} as UrlTree;
      parseUrl.mockReturnValue(loginUrl);

      const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));

      expect(sessionStorage.getItem(PENDING_REDIRECT_STORAGE_KEY)).toBeNull();
      expect(result).toBeInstanceOf(RedirectCommand);
      const command = result as RedirectCommand;
      expect(command.redirectTo).toBe(loginUrl);
      expect(command.navigationBehaviorOptions).toEqual({ replaceUrl: true });
      expect(parseUrl).toHaveBeenCalledWith("/login?direct=1");
    });

    it("should treat an error param as a callback too", async () => {
      mockRoute.queryParams = { error: "access_denied", error_description: "User denied" };
      oauthSignIn.mockRejectedValue(new Error("denied"));

      const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));

      expect(oauthSignIn).toHaveBeenCalledOnce();
      expect(result).toBeInstanceOf(RedirectCommand);
    });

    it("should let an authenticated user through on a stale failed callback", async () => {
      status$.mockReturnValue("authenticated");
      oauthSignIn.mockRejectedValue(new Error("stale"));
      const homeUrl = {} as UrlTree;
      parseUrl.mockReturnValue(homeUrl);

      const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));

      expect(result).toBe(homeUrl);
      expect(parseUrl).toHaveBeenCalledWith("/");
    });
  });

  describe("oidc auto redirect", () => {
    beforeEach(() => {
      info$.mockReturnValue({ enableOidc: true, oidcRedirect: true } as unknown as AppInfo);
    });

    it("should start the flow and cancel the navigation", async () => {
      status$.mockReturnValue("unauthenticated");
      const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));
      expect(result).toBe(false);
      expect(startOidcFlow).toHaveBeenCalledOnce();
    });

    it("should still fire for an authenticated user so the full-page redirect wins", async () => {
      status$.mockReturnValue("authenticated");
      const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));
      expect(result).toBe(false);
      expect(startOidcFlow).toHaveBeenCalledOnce();
    });

    it("should not start the flow for a direct login (?direct=1)", async () => {
      mockRoute.queryParams = { direct: "1" };
      status$.mockReturnValue("unauthenticated");
      const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));
      expect(result).toBe(true);
      expect(startOidcFlow).not.toHaveBeenCalled();
    });
  });

  it("should not start the flow when oidc is disabled", async () => {
    info$.mockReturnValue({ enableOidc: false, oidcRedirect: true } as unknown as AppInfo);
    status$.mockReturnValue("unauthenticated");
    const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));
    expect(result).toBe(true);
    expect(startOidcFlow).not.toHaveBeenCalled();
  });

  it("should not start the flow when oidc redirect is disabled", async () => {
    info$.mockReturnValue({ enableOidc: true, oidcRedirect: false } as unknown as AppInfo);
    status$.mockReturnValue("unauthenticated");
    const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));
    expect(result).toBe(true);
    expect(startOidcFlow).not.toHaveBeenCalled();
  });

  describe("authenticated redirect", () => {
    beforeEach(() => {
      status$.mockReturnValue("authenticated");
    });

    it("should redirect to the pending target and clear it", async () => {
      sessionStorage.setItem(PENDING_REDIRECT_STORAGE_KEY, "/g/default?tab=1");
      const pendingUrl = {} as UrlTree;
      parseUrl.mockReturnValue(pendingUrl);

      const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));

      expect(result).toBe(pendingUrl);
      expect(parseUrl).toHaveBeenCalledWith("/g/default?tab=1");
      expect(sessionStorage.getItem(PENDING_REDIRECT_STORAGE_KEY)).toBeNull();
    });

    it("should ignore an unsafe pending target and redirect to /", async () => {
      sessionStorage.setItem(PENDING_REDIRECT_STORAGE_KEY, "//evil.com");
      const homeUrl = {} as UrlTree;
      parseUrl.mockReturnValue(homeUrl);

      const result = await TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));

      expect(result).toBe(homeUrl);
      expect(parseUrl).toHaveBeenCalledWith("/");
      expect(sessionStorage.getItem(PENDING_REDIRECT_STORAGE_KEY)).toBeNull();
    });
  });
});
