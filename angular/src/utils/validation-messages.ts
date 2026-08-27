import {
  EmailValidationError,
  MaxLengthValidationError,
  MinLengthValidationError,
  type PathKind,
  RequiredValidationError,
  type SchemaPath,
  type SchemaPathRules,
  type ValidationError,
  validate,
} from "@angular/forms/signals";

import type { TranslateService } from "@ngx-translate/core";

/** An i18n message: a dotted key plus its interpolation params. */
export interface I18nMessage {
  readonly key: string;
  readonly params?: Record<string, unknown>;
}

/**
 * Maps a signal-forms validation error to the Mealie i18n message used by the Nuxt
 * frontend's validators (`frontend/app/lib/validators/inputs.ts`).
 *
 * Built-in errors are matched by their error class; custom errors (`whitespace`,
 * `url`, `match`) are matched by `kind`.
 */
export function validationErrorI18n(error: ValidationError): I18nMessage | undefined {
  if (error instanceof RequiredValidationError) return { key: "validators.required" };
  if (error instanceof EmailValidationError) return { key: "validators.invalid-email" };
  if (error instanceof MinLengthValidationError)
    return { key: "validators.min-length", params: { min: error.minLength } };
  if (error instanceof MaxLengthValidationError)
    return { key: "validators.max-length", params: { max: error.maxLength } };
  if (error.kind === "whitespace") return { key: "validators.no-whitespace" };
  if (error.kind === "url") return { key: "validators.invalid-url" };
  if (error.kind === "match") return { key: "user.password-must-match" };
  return undefined;
}

/**
 * Returns the translated message for a field's first validation error, or `null` when
 * the field has no errors.
 *
 * Errors without a Mealie i18n mapping fall back to the `message` the validator set,
 * if any.
 */
export function firstErrorMessage(translate: TranslateService, errors: readonly ValidationError[]): string | null {
  const error = errors[0];
  if (!error) return null;
  const i18n = validationErrorI18n(error);
  return i18n ? translate.instant(i18n.key, i18n.params) : (error.message ?? null);
}

/** Rejects values containing whitespace. Port of the Nuxt `whitespace` validator. */
export function whitespace<TValue extends string, TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<TValue, SchemaPathRules.Supported, TPathKind>,
): void {
  validate(path, (ctx) => (/\s/.test(ctx.value()) ? { kind: "whitespace" } : null));
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Requires a valid http(s) URL; empty values fail. Port of the Nuxt `url` validator. */
export function url<TValue extends string, TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<TValue, SchemaPathRules.Supported, TPathKind>,
): void {
  validate(path, (ctx) => (isValidUrl(ctx.value()) ? null : { kind: "url" }));
}

/** Requires a valid http(s) URL; empty values pass. Port of the Nuxt `urlOptional` validator. */
export function urlOptional<TValue extends string, TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<TValue, SchemaPathRules.Supported, TPathKind>,
): void {
  validate(path, (ctx) => (ctx.value() && !isValidUrl(ctx.value()) ? { kind: "url" } : null));
}
