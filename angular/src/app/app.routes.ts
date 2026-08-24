import { Routes } from "@angular/router";

import { authGuard } from "./auth/auth.guard";
import { loginGuard } from "./auth/login/login.guard";

export const routes: Routes = [
  // ── Public (unauthenticated) routes ─────────────────────────────
  {
    path: "login",
    loadComponent: () => import("./auth/login/login.component"),
    // Handles the OIDC callback and re-routes authenticated users away
    canActivate: [loginGuard],
    data: { title: "user.login" },
  },

  // ── Protected routes ────────────────────────────────────────────
  {
    path: "",
    loadComponent: () => import("./layout/default-layout.component"),
    canActivate: [authGuard],
    children: [{ path: "", pathMatch: "full", redirectTo: "g/default" }],
  },

  // ── Fallback ────────────────────────────────────────────────────
  { path: "**", redirectTo: "" },
];
