import { Routes } from "@angular/router";

import { allowPasswordLoginGuard } from "./forgot-password/allow-password-login.guard";
import { loginGuard } from "./login/login.guard";
import { resetPasswordGuard } from "./reset-password/reset-password.guard";

/**
 * Public (unauthenticated) auth routes: login, forgot password, and reset password.
 */
export const authRoutes: Routes = [
  {
    path: "login",
    loadComponent: () => import("./login/login.component"),
    // Handles the OIDC callback and re-routes authenticated users away
    canActivate: [loginGuard],
    data: { title: "user.login" },
  },
  {
    path: "forgot-password",
    loadComponent: () => import("./forgot-password/forgot-password.component"),
    canActivate: [allowPasswordLoginGuard],
    data: { title: "user.forgot-password" },
  },
  {
    path: "reset-password",
    loadComponent: () => import("./reset-password/reset-password.component"),
    canActivate: [resetPasswordGuard],
    data: { title: "user.reset-password" },
  },
];
