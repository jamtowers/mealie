import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";

import { provideTranslateParser, provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";

import { provideDefaultClient } from "@api/providers";
import { ThemeService } from "@theme/theme.service";

import { routes } from "./app.routes";
import { authInterceptor } from "./auth/auth.interceptor";
import { AuthService } from "./auth/auth.service";
import { LocaleService } from "./locale/locale.service";
import { MealieParser } from "./locale/mealie-parser";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(async () => {
      await inject(AuthService).initialize();
    }),
    provideDefaultClient({
      basePath: "",
    }),
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000",
    }),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: "/lang/",
        suffix: ".json",
      }),
      fallbackLang: "en-US",
      // Mealie's translation files use single-brace {param} interpolation
      parser: provideTranslateParser(MealieParser),
    }),
    provideAppInitializer(() => {
      inject(LocaleService).initialize();
    }),
    provideAppInitializer(() => {
      inject(ThemeService).initialize();
    }),
  ],
};
