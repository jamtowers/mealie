import { Injectable, computed, inject, signal } from "@angular/core";

import { firstValueFrom } from "rxjs";

import type { AppInfo } from "@api/models/app-info";
import type { AppStartupInfo } from "@api/models/app-startup-info";
import { AppAboutService } from "@api/services/appAbout.service";

/**
 * Holds the app-wide "about" info (whether OIDC is enabled, whether password
 * login is allowed, the OIDC provider name, first-login status, ...).
 *
 * It is fetched once during app bootstrap (see app.config.ts) so that guards
 * and the login page can rely on the info being settled before anything
 * renders.
 */
@Injectable({ providedIn: "root" })
export class AppInfoService {
  private readonly appAbout = inject(AppAboutService);

  private readonly info = signal<AppInfo | null>(null);
  readonly info$ = this.info.asReadonly();

  private readonly startupInfo = signal<AppStartupInfo | null>(null);
  readonly startupInfo$ = this.startupInfo.asReadonly();

  /**
   * Derived views with safe defaults: when the fetch failed, the signal stays
   * null, so the password form remains visible, no OIDC button is shown, and
   * no first-login banner is displayed.
   */
  readonly allowPasswordLogin$ = computed(() => this.info()?.allowPasswordLogin ?? true);
  readonly enableOidc$ = computed(() => this.info()?.enableOidc ?? false);
  readonly oidcProviderName$ = computed(() => this.info()?.oidcProviderName ?? "");
  readonly isFirstLogin$ = computed(() => this.startupInfo()?.isFirstLogin ?? false);

  private initialized = false;

  /**
   * Fetches the app info and startup info in parallel. Idempotent — extra
   * calls are ignored.
   *
   * Failures are swallowed independently: a failed fetch keeps its signal
   * null, so consumers fall back to safe defaults (password form visible,
   * no OIDC button, no first-login banner).
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    const [appInfo, startup] = await Promise.all([
      firstValueFrom(this.appAbout.getAppInfoApiAppAboutGet()).catch(() => null),
      firstValueFrom(this.appAbout.getStartupInfoApiAppAboutStartupInfoGet()).catch(() => null),
    ]);
    this.info.set(appInfo);
    this.startupInfo.set(startup);
  }
}
