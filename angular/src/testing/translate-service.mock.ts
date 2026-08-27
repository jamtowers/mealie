import { signal } from "@angular/core";

import { ITranslateService } from "@ngx-translate/core";
import { of } from "rxjs";

/**
 * Partial fake `TranslateService` for component tests.
 * `instant()` and `get()` return `[key]` so translations are traceable in assertions.
 */
export const mockTranslateService = {
  currentLang: signal("en-US"),
  instant: (key: string | string[]) => `[${key}]`,
  get: (key: string | string[]) => of(`[${key}]`),
  translate: (key: string | string[]) => signal(`[${key}]`),
} as unknown as ITranslateService;
