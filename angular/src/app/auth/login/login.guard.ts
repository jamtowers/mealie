import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, RedirectCommand, Router } from "@angular/router";

import { AppInfoService } from "@utils/app-info.service";
import { isSafeRedirectTarget } from "@utils/redirect";

import { AuthService, PENDING_REDIRECT_STORAGE_KEY } from "../auth.service";

/**
 * Handles the OIDC flow on the login route and re-routes authenticated users away from it.
 *
 * - If the provider redirected us back (`?code=` or `?error=`) we finish the
 *   sign-in. On failure the error is stashed in the auth service for the
 *   login page to display, and we bounce back to the plain login page
 *   (`?direct=1` so the auto-redirect below doesn't loop).
 * - If there is no callback and OIDC is configured to auto-redirect, we
 *   start the flow — which leaves the app with a full page load, so the
 *   navigation is cancelled.
 * - An authenticated user never stays on the login page: they're sent to the
 *   pending redirect target saved when an OIDC flow started, else home.
 *
 * Query params are read from the route snapshot, not `window.location`:
 * during a `RedirectCommand` re-entry (e.g. after a failed callback bounce)
 * the browser URL lags behind the router URL, so `window.location.search`
 * would still contain the callback params and re-trigger the sign-in in an
 * infinite loop.
 */
export const loginGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const appInfoService = inject(AppInfoService);
  const router = inject(Router);

  const queryParams = route.queryParams;

  // The provider redirected us back with a code (or an error) — finish the login
  if (queryParams["code"] || queryParams["error"]) {
    const isAuthenticated = authService.status$() === "authenticated";

    try {
      await authService.oauthSignIn();
    } catch {
      if (!isAuthenticated) {
        clearPendingRedirect();

        // replaceUrl so the back button doesn't replay the consumed `code`
        return new RedirectCommand(router.parseUrl("/login?direct=1"), { replaceUrl: true });
      }
      // A logged-in user landed on a stale/failed callback — let them
      // through, they get re-routed below
    }
  } else {
    const info = appInfoService.info$();
    const isDirectLogin = queryParams["direct"] === "1";

    if (info?.enableOidc && info.oidcRedirect && !isDirectLogin) {
      authService.startOidcFlow();
      return false;
    }
  }

  // Send authenticated users on their way: to the pending redirect target
  // saved when an OIDC flow started, else home. This check stays last so an
  // auto-redirect (full page load to the provider) still fires for an
  // authenticated user landing here.
  if (authService.status$() === "authenticated") {
    const pendingRedirect = consumePendingRedirect();
    return router.parseUrl(pendingRedirect ?? "/");
  }

  return true;
};

/**
 * Consume the pending redirect target saved when an OIDC flow started.
 * Returns the target (and clears storage), or null when there is none or
 * it is not safe to navigate to.
 */
function consumePendingRedirect(): string | null {
  let target: string | null = null;
  try {
    target = sessionStorage.getItem(PENDING_REDIRECT_STORAGE_KEY);
    sessionStorage.removeItem(PENDING_REDIRECT_STORAGE_KEY);
  } catch {
    // sessionStorage may be unavailable in some environments
  }

  return isSafeRedirectTarget(target) ? target : null;
}

/** Drop any pending redirect target, e.g. when the OIDC flow fails. */
function clearPendingRedirect(): void {
  try {
    sessionStorage.removeItem(PENDING_REDIRECT_STORAGE_KEY);
  } catch {
    // sessionStorage may be unavailable in some environments
  }
}
