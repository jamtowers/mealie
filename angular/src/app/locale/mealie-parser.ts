import { Injectable } from "@angular/core";

import { TranslateDefaultParser } from "@ngx-translate/core";

/**
 * Mealie's translation files use i18next-style single-brace interpolation
 * (e.g. `"You have {count} recipes"`), whereas ngx-translate's default parser
 * only matches double braces (e.g. `"{{count}}"`). This parser reuses the
 * default implementation with a single-brace template matcher.
 */
@Injectable({ providedIn: "root" })
export class MealieParser extends TranslateDefaultParser {
  override templateMatcher = /\{\s?([^{}\s]*)\s?\}/g;
}
