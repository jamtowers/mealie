import { signal } from "@angular/core";
import { of } from "rxjs";

import { ITranslateService } from "@ngx-translate/core";

/**
 * Partial fake `TranslateService` for component tests.
 * `instant()` and `get()` return `[key]` so translations are traceable in assertions.
 */
export const mockTranslateService = {
  currentLang: signal("en-US"),
  instant: (key: string | string[]) => `[${key}]`,
  get: (key: string | string[]) => of(`[${key}]`),
  translate: () => signal(""),
} as unknown as ITranslateService;
