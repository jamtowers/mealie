import { Routes } from "@angular/router";

import { authGuard } from "./auth/auth.guard";
import { authRoutes } from "./auth/auth.routes";

export const routes: Routes = [
  ...authRoutes,

  {
    path: "",
    loadComponent: () => import("./layout/default-layout.component"),
    canActivate: [authGuard],
    children: [{ path: "", pathMatch: "full", redirectTo: "g/default" }],
  },

  { path: "**", redirectTo: "" },
];
