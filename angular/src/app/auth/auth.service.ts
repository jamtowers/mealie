import { HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";

import { MatSnackBar } from "@angular/material/snack-bar";

import { TranslateService } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";

import type { UserOut } from "@api/models/user-out";
import { UsersAuthenticationService } from "@api/services/usersAuthentication.service";
import { UsersCRUDService } from "@api/services/usersCRUD.service";
import { BASE_PATH_DEFAULT } from "@api/tokens";

const TOKEN_STORAGE_KEY = "mealie.access_token";

// Read/consumed by the login guard, which is the only place pending redirects
// are ever read — kept here next to the writer
export const PENDING_REDIRECT_STORAGE_KEY = "mealie.pending_redirect";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface SignInCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly router = inject(Router);
  private readonly basePath = inject(BASE_PATH_DEFAULT);
  private readonly authApi = inject(UsersAuthenticationService);
  private readonly usersApi = inject(UsersCRUDService);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly user = signal<UserOut | null>(null);
  private readonly status = signal<AuthStatus>("loading");

  // Read-only signals for consumers
  readonly user$ = this.user.asReadonly();
  readonly status$ = this.status.asReadonly();

  async initialize() {
    // Sync auth state across tabs: StorageEvent fires in other tabs when
    // localStorage changes, but not in the tab that made the change.
    window.addEventListener("storage", async (event) => {
      if (event.key === TOKEN_STORAGE_KEY) {
        if (!event.newValue) {
          // Another tab logged out — clear state
          this.resetState();
        } else {
          // Another tab logged in — refresh session in this tab
          await this.getSession();
        }

        // Force navigation to trigger route guards/reload the page
        // we grab the current browser url as the "canonical" url the login screen appears on
        // any path that requires auth so we want to resolve that path not the path that the
        // router is currently resolving (which would be /login in that case)
        const browserPath = new URL(window.location.href).pathname;
        const url = this.router.url;

        // If the browser path and the angular router url match then trying to navigate to the same route won't do anything
        // (angular will see the path is the same and do nothing), so we resolve another path quickly before going back to
        // the path we want to reload
        if (browserPath === url) {
          if (url === "/") await this.router.navigateByUrl("/login", { skipLocationChange: true });
          else await this.router.navigateByUrl("/", { skipLocationChange: true });
        }

        // Finally resolve the path we want
        await this.router.navigateByUrl(browserPath, { replaceUrl: true });
      }
    });

    // initialize session info
    return this.getSession();
  }

  /**
   * Send credentials to the backend, store the returned token, then
   * fetch the user session.
   */
  async signIn({ username, password, rememberMe }: SignInCredentials): Promise<void> {
    this.status.set("loading");

    try {
      const response = await firstValueFrom(this.authApi.getTokenApiAuthTokenPost(username, password, rememberMe));

      const accessToken = response.access_token;
      this.setToken(accessToken);
      await this.getSession();
    } catch (error) {
      this.status.set("unauthenticated");
      throw error;
    }
  }

  /**
   * Finish the OIDC flow: trade the `code`/`state` query params the provider
   * redirected us back with for a Mealie token, then load the session.
   *
   * The backend's authlib client validates `state` against the one it issued,
   * so both params are forwarded verbatim.
   */
  async oauthSignIn(): Promise<void> {
    this.status.set("loading");

    try {
      const search = new URLSearchParams(window.location.search);
      const response = await firstValueFrom(
        this.authApi.oauthCallbackApiAuthOauthCallbackGet(
          search.get("code") ?? undefined,
          search.get("state") ?? undefined,
        ),
      );

      this.setToken(response.access_token);
      await this.getSession();
    } catch (error: HttpErrorResponse | unknown) {
      this.status.set("unauthenticated");
      this.snackBar.open(this.oidcErrorMessage(error), "Close", { panelClass: "error" });
      throw error;
    }
  }

  private oidcErrorMessage(error: HttpErrorResponse | unknown): string {
    const status =
      error && typeof error === "object" && "status" in error ? (error as HttpErrorResponse).status : undefined;

    switch (status) {
      case 401:
        return this.translate.instant("user.invalid-credentials");
      case 423:
        return this.translate.instant("user.account-locked-please-try-again-later");
      default:
        return this.translate.instant("events.something-went-wrong");
    }
  }

  /**
   * Kick off the OIDC flow.
   *
   * The provider round trip is a full page load that lands on the backend's
   * fixed `<base>/login` callback, so whatever page was behind the login
   * screen is lost from the URL — snapshot it here, then leave the app.
   */
  startOidcFlow(): void {
    const url = new URL(window.location.href);
    if (url.pathname !== "/login") {
      this.setPendingRedirect(url.pathname + url.search);
    }

    window.location.assign(`${this.basePath}/api/auth/oauth`);
  }

  /**
   * Notify the backend, clear local state, and navigate away.
   */
  async signOut(callbackUrl = "/login"): Promise<void> {
    try {
      await firstValueFrom(this.authApi.logoutApiAuthLogoutPost());
    } catch (error) {
      // Continue with logout even if the API call fails
      console.warn("Logout API call failed:", error);
    } finally {
      this.setToken(null);
      this.resetState();
      await this.router.navigate([callbackUrl]);
    }
  }

  /**
   * Use a valid token to get a fresh one, then re-fetch the session.
   */
  async refresh(): Promise<void> {
    if (!this.getToken()) return;

    try {
      const response = await firstValueFrom(this.authApi.refreshTokenApiAuthRefreshGet());
      const accessToken = response.access_token;
      this.setToken(accessToken);
      await this.getSession();
    } catch (error) {
      this.handleAuthError(error, true);
      throw error;
    }
  }

  /**
   * Fetch the current user profile.  If no token exists we immediately
   * mark the user as unauthenticated.
   */
  async getSession(): Promise<void> {
    if (!this.getToken()) {
      this.user.set(null);
      this.status.set("unauthenticated");
      return;
    }

    this.status.set("loading");

    try {
      const user = await firstValueFrom(this.usersApi.getLoggedInUserApiUsersSelfGet());
      this.user.set(user);
      this.status.set("authenticated");
    } catch (error) {
      console.error("Failed to fetch user session:", error);
      this.handleAuthError(error);
      this.status.set("unauthenticated");
    }
  }

  // ── Storage helpers ──────────────────────────────────────────────

  setToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // localStorage may be unavailable in some environments (e.g. private browsing)
    }
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable in some environments (e.g. private browsing)
      return null;
    }
  }

  // ── Internal helpers ────────────────────────────────────────────

  private resetState(): void {
    this.user.set(null);
    this.status.set("unauthenticated");
  }

  private setPendingRedirect(target: string): void {
    try {
      sessionStorage.setItem(PENDING_REDIRECT_STORAGE_KEY, target);
    } catch {
      // sessionStorage may be unavailable in some environments
    }
  }

  private handleAuthError(error: unknown, redirect = false): void {
    // Angular HttpClient errors: error.status holds the HTTP status code
    if (error && typeof error === "object" && "status" in error && (error as { status: number }).status === 401) {
      this.setToken(null);
      this.resetState();

      if (redirect) {
        this.router.navigate(["/login"]);
      }
    }
  }
}
