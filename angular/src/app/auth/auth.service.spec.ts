import { HttpClient, provideHttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";

import { MatSnackBar } from "@angular/material/snack-bar";

import { TranslateService } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import type { Mock } from "vitest";

import type { UserOut } from "@api/models/user-out";
import { UsersAuthenticationService } from "@api/services/usersAuthentication.service";
import { UsersCRUDService } from "@api/services/usersCRUD.service";
import { BASE_PATH_DEFAULT } from "@api/tokens";
import { mockLocalStorage } from "@testing/local-storage.mock";
import { mockLocation } from "@testing/location.mock";

import { AuthService, PENDING_REDIRECT_STORAGE_KEY, type SignInCredentials } from "./auth.service";

const TOKEN_STORAGE_KEY = "mealie.access_token";

const originalUrl = window.location.href;

// Target for the catch-all route so navigations performed by the service
// (signOut, 401 redirects) resolve instead of failing with NG04002.
@Component({ template: "" })
class StubComponent {}

function createMockUser(overrides: Partial<UserOut> = {}): UserOut {
  return {
    id: "user-1",
    email: "user@example.com",
    group: "group-1",
    household: "household-1",
    groupId: "group-1",
    groupSlug: "group-slug",
    householdId: "household-1",
    householdSlug: "household-slug",
    cacheKey: "cache-key",
    ...overrides,
  };
}

function createHttpError(status: number): Error & { status: number } {
  const error = new Error(`HTTP error status: ${status}`) as Error & { status: number };
  error.status = status;
  return error;
}

describe("AuthService", () => {
  let authService: AuthService;
  let router: Router;

  // Spies are (re)created for every test in beforeEach. Creating them once at
  // describe scope doesn't work because restoreAllMocks() in afterEach()
  // restores the original implementations and detaches the spies, so the
  // mockReset()/mockReturnValue() re-arming would have no effect and every
  // test after the first one would hit the real HTTP backend.
  let tokenRequest: ReturnType<typeof vi.spyOn>;
  let refreshRequest: ReturnType<typeof vi.spyOn>;
  let logoutRequest: ReturnType<typeof vi.spyOn>;
  let selfRequest: ReturnType<typeof vi.spyOn>;
  let oauthCallbackRequest: ReturnType<typeof vi.spyOn>;
  let snackBarOpen: Mock<(message: string, action?: string, options?: object) => void>;

  // Each test injects a fresh AuthService and its constructor registers a
  // window "storage" listener that is never torn down. We capture the
  // current test's listener so it can be removed in afterEach; otherwise
  // every previously created instance would also react to the events
  // dispatched in the cross-tab tests.
  let removeStorageListener: () => void = () => undefined;

  beforeEach(async () => {
    mockLocalStorage();
    localStorage.clear();
    sessionStorage.clear();
    tokenRequest = vi
      .spyOn(UsersAuthenticationService.prototype, "getTokenApiAuthTokenPost")
      .mockReturnValue(of({ access_token: "new-token" }) as never);
    refreshRequest = vi
      .spyOn(UsersAuthenticationService.prototype, "refreshTokenApiAuthRefreshGet")
      .mockReturnValue(of({ access_token: "refreshed-token" }) as never);
    logoutRequest = vi
      .spyOn(UsersAuthenticationService.prototype, "logoutApiAuthLogoutPost")
      .mockReturnValue(of(null) as never);
    selfRequest = vi
      .spyOn(UsersCRUDService.prototype, "getLoggedInUserApiUsersSelfGet")
      .mockReturnValue(of(createMockUser()) as never);
    oauthCallbackRequest = vi
      .spyOn(UsersAuthenticationService.prototype, "oauthCallbackApiAuthOauthCallbackGet")
      .mockReturnValue(of({ access_token: "oidc-token" }) as never);
    // HttpClient is only needed so the (mocked) api services can be instantiated
    vi.spyOn(HttpClient.prototype, "request").mockReturnValue(of({}) as never);
    snackBarOpen = vi.fn();

    const originalAddEventListener = window.addEventListener.bind(window);
    let capturedStorageListener: EventListener | null = null;
    window.addEventListener = (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (type === "storage") {
        capturedStorageListener = listener as EventListener;
      }
      return originalAddEventListener(type, listener, options);
    };

    await TestBed.configureTestingModule({
      providers: [
        // Catch-all route so router navigations inside the service resolve.
        provideRouter([{ path: "**", component: StubComponent }]),
        // Same as app.config.ts — URLs are built relative to the page origin
        { provide: BASE_PATH_DEFAULT, useValue: "" },
        provideHttpClient(),
        // The service shows snackbar messages itself, keyed by translation id
        { provide: MatSnackBar, useValue: { open: snackBarOpen } },
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
        AuthService,
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);

    await authService.initialize();

    window.addEventListener = originalAddEventListener;
    removeStorageListener = () => {
      if (capturedStorageListener !== null) {
        window.removeEventListener("storage", capturedStorageListener);
      }
    };
  });

  afterEach(() => {
    removeStorageListener();
    removeStorageListener = () => undefined;
    window.history.replaceState({}, "", originalUrl);
    vi.restoreAllMocks();
  });

  describe("token storage", () => {
    it("should store a token in localStorage", () => {
      authService.setToken("my-token");

      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("my-token");
      expect(authService.getToken()).toBe("my-token");
    });

    it("should remove the token from localStorage when set to null", () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, "my-token");

      authService.setToken(null);

      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
      expect(authService.getToken()).toBeNull();
    });
  });

  describe("getSession", () => {
    it("should fetch the user and mark the session authenticated when a token exists", async () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, "valid-token");

      await authService.getSession();

      expect(selfRequest).toHaveBeenCalledTimes(1);
      expect(authService.user$()).toEqual(createMockUser());
      expect(authService.status$()).toBe("authenticated");
    });

    it("should not call the api and mark the session unauthenticated when there is no token", async () => {
      await authService.getSession();

      expect(selfRequest).not.toHaveBeenCalled();
      expect(authService.user$()).toBeNull();
      expect(authService.status$()).toBe("unauthenticated");
    });

    it("should mark the session unauthenticated when the api request fails", async () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, "valid-token");
      selfRequest.mockReturnValue(throwError(() => new Error("network down")));
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

      await authService.getSession();

      expect(consoleError).toHaveBeenCalledWith("Failed to fetch user session:", expect.any(Error));
      expect(authService.user$()).toBeNull();
      expect(authService.status$()).toBe("unauthenticated");
    });

    it("should clear the token when the api responds with a 401", async () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, "expired-token");
      selfRequest.mockReturnValue(throwError(() => createHttpError(401)));
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

      await authService.getSession();

      expect(consoleError).toHaveBeenCalledWith("Failed to fetch user session:", expect.any(Error));
      expect(authService.getToken()).toBeNull();
      expect(authService.user$()).toBeNull();
      expect(authService.status$()).toBe("unauthenticated");
    });
  });

  describe("signIn", () => {
    const credentials: SignInCredentials = { username: "user", password: "pass", rememberMe: true };

    it("should request a token, store it, and load the session", async () => {
      await authService.signIn(credentials);

      expect(tokenRequest).toHaveBeenCalledWith("user", "pass", true);
      expect(authService.getToken()).toBe("new-token");
      expect(selfRequest).toHaveBeenCalledTimes(1);
      expect(authService.status$()).toBe("authenticated");
      expect(authService.user$()).toEqual(createMockUser());
    });

    it("should rethrow the error and mark the session unauthenticated when the token request fails", async () => {
      tokenRequest.mockReturnValue(throwError(() => createHttpError(401)));
      let thrown: unknown;

      try {
        await authService.signIn(credentials);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(Error);
      expect(authService.getToken()).toBeNull();
      expect(authService.status$()).toBe("unauthenticated");
      expect(selfRequest).not.toHaveBeenCalled();
    });
  });

  describe("oauthSignIn", () => {
    beforeEach(() => {
      window.history.replaceState({}, "", "/login?code=abc&state=xyz");
    });

    it("should trade the callback code for a token and load the session", async () => {
      await authService.oauthSignIn();

      expect(oauthCallbackRequest).toHaveBeenCalledWith("abc", "xyz");
      expect(authService.getToken()).toBe("oidc-token");
      expect(selfRequest).toHaveBeenCalledTimes(1);
      expect(authService.status$()).toBe("authenticated");
      expect(authService.user$()).toEqual(createMockUser());
      expect(snackBarOpen).not.toHaveBeenCalled();
    });

    it("should rethrow the error and mark the session unauthenticated when the callback fails", async () => {
      oauthCallbackRequest.mockReturnValue(throwError(() => createHttpError(401)));

      await expect(authService.oauthSignIn()).rejects.toBeInstanceOf(Error);

      expect(authService.getToken()).toBeNull();
      expect(authService.status$()).toBe("unauthenticated");
      expect(selfRequest).not.toHaveBeenCalled();
    });

    it("should show an invalid credentials snackbar when the callback fails with 401", async () => {
      oauthCallbackRequest.mockReturnValue(throwError(() => createHttpError(401)));

      await expect(authService.oauthSignIn()).rejects.toBeInstanceOf(Error);

      expect(snackBarOpen).toHaveBeenCalledWith("user.invalid-credentials", "Close", {
        panelClass: "error",
      });
    });

    it("should show an account locked snackbar when the callback fails with 423", async () => {
      oauthCallbackRequest.mockReturnValue(throwError(() => createHttpError(423)));

      await expect(authService.oauthSignIn()).rejects.toBeInstanceOf(Error);

      expect(snackBarOpen).toHaveBeenCalledWith("user.account-locked-please-try-again-later", "Close", {
        panelClass: "error",
      });
    });

    it("should show a generic error snackbar for other callback failures", async () => {
      oauthCallbackRequest.mockReturnValue(throwError(() => createHttpError(500)));

      await expect(authService.oauthSignIn()).rejects.toBeInstanceOf(Error);

      expect(snackBarOpen).toHaveBeenCalledWith("events.something-went-wrong", "Close", {
        panelClass: "error",
      });
    });
  });

  describe("startOidcFlow", () => {
    it("should snapshot the current page as the pending redirect before leaving the app", () => {
      const assign = vi.fn();
      vi.spyOn(window, "location", "get").mockReturnValue({
        href: "http://localhost/recipes?tag=pie",
        assign,
      } as unknown as Location);

      authService.startOidcFlow();

      expect(sessionStorage.getItem(PENDING_REDIRECT_STORAGE_KEY)).toBe("/recipes?tag=pie");
      expect(assign).toHaveBeenCalledWith("/api/auth/oauth");
    });

    it("should not snapshot a pending redirect when already on /login", () => {
      const assign = vi.fn();
      vi.spyOn(window, "location", "get").mockReturnValue({
        href: "http://localhost/login",
        assign,
      } as unknown as Location);

      authService.startOidcFlow();

      expect(sessionStorage.getItem(PENDING_REDIRECT_STORAGE_KEY)).toBeNull();
      expect(assign).toHaveBeenCalledWith("/api/auth/oauth");
    });
  });

  describe("signOut", () => {
    it("should call the logout api, clear the session, and navigate to /login by default", async () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, "valid-token");
      await authService.getSession();

      await authService.signOut();

      expect(logoutRequest).toHaveBeenCalledTimes(1);
      expect(authService.getToken()).toBeNull();
      expect(authService.user$()).toBeNull();
      expect(authService.status$()).toBe("unauthenticated");
      expect(router.url).toBe("/login");
    });

    it("should navigate to the provided callback url", async () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, "valid-token");
      await authService.getSession();

      await authService.signOut("/dashboard");

      expect(router.url).toBe("/dashboard");
    });

    it("should still clear the session and navigate when the logout api fails", async () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, "valid-token");
      await authService.getSession();
      logoutRequest.mockReturnValue(throwError(() => createHttpError(500)));
      const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await authService.signOut();

      expect(consoleWarn).toHaveBeenCalled();
      expect(authService.getToken()).toBeNull();
      expect(authService.user$()).toBeNull();
      expect(authService.status$()).toBe("unauthenticated");
      expect(router.url).toBe("/login");
    });
  });

  describe("refresh", () => {
    it("should do nothing when there is no token", async () => {
      await authService.refresh();

      expect(refreshRequest).not.toHaveBeenCalled();
      expect(selfRequest).not.toHaveBeenCalled();
    });

    it("should store the new token and reload the session", async () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, "old-token");
      selfRequest.mockReturnValue(of(createMockUser({ email: "refreshed@example.com" })) as never);

      await authService.refresh();

      expect(refreshRequest).toHaveBeenCalledTimes(1);
      expect(authService.getToken()).toBe("refreshed-token");
      expect(authService.status$()).toBe("authenticated");
      expect(authService.user$()?.email).toBe("refreshed@example.com");
    });

    it("should clear the token, redirect to /login, and rethrow when the api responds with a 401", async () => {
      vi.useFakeTimers();
      localStorage.setItem(TOKEN_STORAGE_KEY, "old-token");
      refreshRequest.mockReturnValue(throwError(() => createHttpError(401)));
      let thrown: unknown;

      try {
        await authService.refresh();
      } catch (error) {
        thrown = error;
      }

      // make sure the router has actually caught up
      await vi.runAllTimersAsync();

      expect(thrown).toBeInstanceOf(Error);
      expect(authService.getToken()).toBeNull();
      expect(authService.status$()).toBe("unauthenticated");
      expect(router.url).toBe("/login");
      vi.useRealTimers();
    });
  });

  describe("cross-tab sync (storage event)", () => {
    it("should refresh the session when another tab logs in", async () => {
      // In a real browser the other tab's write is already visible in this
      // tab's localStorage by the time the storage event fires.
      localStorage.setItem(TOKEN_STORAGE_KEY, "other-tab-token");

      window.dispatchEvent(new StorageEvent("storage", { key: TOKEN_STORAGE_KEY, newValue: "other-tab-token" }));
      await Promise.resolve();

      expect(selfRequest).toHaveBeenCalledTimes(1);
      expect(authService.status$()).toBe("authenticated");
      expect(authService.user$()).toEqual(createMockUser());
    });

    it("should reset the session when another tab logs out", async () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, "valid-token");
      await authService.getSession();

      window.dispatchEvent(new StorageEvent("storage", { key: TOKEN_STORAGE_KEY, newValue: null }));
      await Promise.resolve();

      expect(authService.user$()).toBeNull();
      expect(authService.status$()).toBe("unauthenticated");
    });

    it("should navigate to root then back when browser path matches router url and is not root", async () => {
      vi.useFakeTimers();

      // Navigate router to a non-root path so router.url !== "/"
      await router.navigateByUrl("/recipes");

      // Stub window.location to match the router url
      mockLocation("http://localhost/recipes");

      localStorage.setItem(TOKEN_STORAGE_KEY, "other-tab-token");

      window.dispatchEvent(new StorageEvent("storage", { key: TOKEN_STORAGE_KEY, newValue: "other-tab-token" }));
      await vi.runAllTimersAsync();

      // Line 58: router.navigateByUrl("/", { skipLocationChange: true }) should have been called
      expect(authService.status$()).toBe("authenticated");
      vi.useRealTimers();
    });

    it("should skip the conditional navigation when browser path differs from router url", async () => {
      vi.useFakeTimers();

      await router.navigateByUrl("/login");

      // Browser path differs from router url — skips lines 56-58
      mockLocation("http://localhost/recipes");

      localStorage.setItem(TOKEN_STORAGE_KEY, "other-tab-token");

      window.dispatchEvent(new StorageEvent("storage", { key: TOKEN_STORAGE_KEY, newValue: "other-tab-token" }));
      await vi.runAllTimersAsync();

      expect(authService.status$()).toBe("authenticated");
      vi.useRealTimers();
    });

    it("should ignore storage events for unrelated keys", async () => {
      const key = "some-other-key";
      window.dispatchEvent(new StorageEvent("storage", { key, newValue: "value" }));
      await Promise.resolve();

      expect(selfRequest).not.toHaveBeenCalled();
    });
  });

  describe("getToken", () => {
    it("should return null when localStorage is unavailable", () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => {
        throw new Error("localStorage unavailable");
      };

      const result = authService.getToken();

      expect(result).toBeNull();
      localStorage.getItem = originalGetItem;
    });
  });
});
