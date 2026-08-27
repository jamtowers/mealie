import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { AppInfoService } from "@utils/app-info.service";

/**
 * Denies route when the app disallows password login.
 * (e.g. OIDC-only setups don't handle forgotten passwords through Mealie)
 */
export const allowPasswordLoginGuard: CanActivateFn = () => {
  const appInfoService = inject(AppInfoService);
  const router = inject(Router);

  if (!appInfoService.allowPasswordLogin$()) {
    return router.parseUrl("/login");
  }

  return true;
};
