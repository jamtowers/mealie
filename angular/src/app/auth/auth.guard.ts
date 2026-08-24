import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, RedirectCommand, Router } from "@angular/router";

import { AuthService } from "./auth.service";

/**
 * Redirects unauthenticated users to the login page.
 */
export const authGuard: CanActivateFn = (/* route: ActivatedRouteSnapshot, state: RouterStateSnapshot */) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  switch (authService.status$()) {
    case "authenticated":
      return true;

    case "unauthenticated": {
      const loginPath = router.parseUrl("/login");
      return new RedirectCommand(loginPath, {
        // This means we show the login page without changing the url on the browser
        // So once the user logs in it will load up the specific page they were trying to get to
        skipLocationChange: true,
      });
    }

    // This should never really happen as this is resolved before the app has launched
    // but if a user manages to start a navigation while auth state is getting resolved
    // we just block it
    case "loading":
    default:
      console.warn("Tried navigating while auth state is getting resolved, ignoring.");
      return false;
  }
};

/**
 * Blocks non-admin users from admin routes.
 */
export const adminGuard: CanActivateFn = (/* _route: ActivatedRouteSnapshot, _state: RouterStateSnapshot */) => {
  const authService = inject(AuthService);

  const user = authService.user$();

  if (!user || !user.admin) {
    return false;
  }

  return true;
};

/**
 * Blocks users without the `canManage` permission.
 */
export const manageGuard: CanActivateFn = (/* _route: ActivatedRouteSnapshot, _state: RouterStateSnapshot */) => {
  const authService = inject(AuthService);

  const user = authService.user$();
  if (!user || !user.canManage) {
    console.warn("User is not allowed to manage group settings");
    return false;
  }

  return true;
};

/**
 * Blocks users without the `canManageHousehold` permission.
 */
export const householdGuard: CanActivateFn = (/* _route: ActivatedRouteSnapshot, _state: RouterStateSnapshot */) => {
  const authService = inject(AuthService);

  const user = authService.user$();
  if (!user || !user.canManageHousehold) {
    console.warn("User is not allowed to manage household");
    return false;
  }

  return true;
};

/**
 * Blocks users without the `canOrganize` permission.
 */
export const organizeGuard: CanActivateFn = (/* _route: ActivatedRouteSnapshot, _state: RouterStateSnapshot */) => {
  const authService = inject(AuthService);

  const user = authService.user$();
  if (!user || !user.canOrganize) {
    console.warn("User is not allowed to organize data");
    return false;
  }

  return true;
};

/**
 * Ensures the route's `groupSlug` parameter matches the current user's group.
 * Use on routes that have a `groupSlug` parameter (e.g., `/g/:groupSlug/...`).
 */
export const groupOnlyGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);

  const user = authService.user$();
  const groupSlug = route.params["groupSlug"];

  if (!user || groupSlug !== user.groupSlug) {
    return false;
  }

  return true;
};

/**
 * Blocks users who don't have access to advanced features.
 */
export const advancedOnlyGuard: CanActivateFn = (/* _route: ActivatedRouteSnapshot, _state: RouterStateSnapshot */) => {
  const authService = inject(AuthService);

  const user = authService.user$();
  if (!user || !user.advanced) {
    console.warn("User is not allowed to access advanced features");
    return false;
  }

  return true;
};
