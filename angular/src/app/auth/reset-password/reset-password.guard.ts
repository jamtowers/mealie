import { inject } from "@angular/core";
import { CanActivateFn, RedirectCommand, Router } from "@angular/router";

/**
 * Denies the route when the reset token from the email link is missing:
 * without a `token` query param the reset form can't be submitted, so the
 * user is sent back to the login page.
 */
export const resetPasswordGuard: CanActivateFn = (route) => {
  const router = inject(Router);

  if (!route.queryParams["token"]) {
    // replaceUrl so the back button doesn't replay the token-less URL
    return new RedirectCommand(router.parseUrl("/login"), { replaceUrl: true });
  }

  return true;
};
