import { Injectable } from "@angular/core";

import { type InterpolateFunction, type InterpolationParameters, TranslateDefaultParser } from "@ngx-translate/core";

/**
 * Mealie's translation files use i18next-style single-brace interpolation
 * (e.g. `"You have {count} recipes"`), whereas ngx-translate's default parser
 * only matches double braces (e.g. `"{{count}}"`). This parser reuses the
 * default implementation with a single-brace template matcher.
 *
 * It also understands the legacy vue-i18n `|`-separated plural forms the locale
 * files use for the Nuxt frontend (e.g. `"No item|One item|{count} items"`),
 * selecting the form with vue-i18n's rules: two forms are singular|plural,
 * three or more are zero|one|other.
 */
@Injectable({ providedIn: "root" })
export class MealieParser extends TranslateDefaultParser {
  override templateMatcher = /\{\s?([^{}\s]*)\s?\}/g;

  override interpolate(expr: InterpolateFunction | string, params?: InterpolationParameters): string | undefined {
    const form = typeof expr === "string" ? this.selectPluralForm(expr, params) : undefined;
    return super.interpolate(form ?? expr, params);
  }

  /**
   * Returns the `|`-separated plural form matching the numeric interpolation
   * parameter, or `undefined` when the expression has no forms to select
   * from or no numeric parameter to select them with.
   */
  private selectPluralForm(expr: string, params?: InterpolationParameters): string | undefined {
    if (!expr.includes("|")) return undefined;

    const value = this.selectPluralValue(params);
    if (value === undefined) return undefined;

    const forms = expr.split("|");
    let index: number;
    if (forms.length === 2) {
      index = value === 1 ? 0 : 1;
    } else if (value === 0) {
      index = 0;
    } else if (value === 1) {
      index = 1;
    } else {
      index = forms.length - 1;
    }
    return forms[index];
  }

  /**
   * The numeric value used to select a plural form: `count`, `min`, or `max`
   * when one of them is a number, otherwise the first numeric parameter.
   */
  private selectPluralValue(params?: InterpolationParameters): number | undefined {
    if (!params) return undefined;

    for (const key of ["count", "min", "max"]) {
      const value = params[key];
      if (typeof value === "number") return value;
    }

    for (const value of Object.values(params)) {
      if (typeof value === "number") return value;
    }

    return undefined;
  }
}
