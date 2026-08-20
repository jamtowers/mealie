import { Routes } from "@angular/router";

import { authGuard, unauthGuard } from "./auth/auth.guard";

export const routes: Routes = [
  // ── Public (unauthenticated) routes ─────────────────────────────
  {
    path: "login",
    loadComponent: () => import("./auth/login/login.component"),
    canActivate: [unauthGuard],
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
