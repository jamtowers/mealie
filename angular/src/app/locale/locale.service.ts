import { Injectable, computed, inject, signal } from "@angular/core";

import { TranslateService } from "@ngx-translate/core";

import { LOCALES } from "./available-locales";

/** localStorage key for the user's language preference */
const STORAGE_KEY = "mealie-language";

/** Fallback locale when there is no stored preference and no browser match */
const DEFAULT_LOCALE = "en-US";

export type Locale = (typeof LOCALES)[number];

@Injectable({ providedIn: "root" })
export class LocaleService {
  /** Active locale code (e.g. "en-US") */
  readonly locale = signal<string>(resolveInitialLocale());

  /** Display name of the active locale (falls back to the raw code) */
  readonly currentLocaleName = computed(() => {
    const current = this.locale();
    return LOCALES.find((l) => l.value === current)?.name ?? current;
  });

  private readonly translate = inject(TranslateService);

  initialize() {
    // Register every available language so the user can switch to any of them
    this.translate.addLangs(LOCALES.map((l) => l.value));
    this.apply(this.locale());
  }

  /** Switch to `value`, persist the choice, and apply it to the document. */
  setLocale(value: string): void {
    this.locale.set(value);
    localStorage.setItem(STORAGE_KEY, value);
    this.apply(value);
  }

  private apply(localeCode: string): void {
    this.translate.use(localeCode);
    const entry = LOCALES.find((l) => l.value === localeCode);
    document.documentElement.lang = localeCode;
    document.documentElement.dir = entry?.dir ?? "ltr";
  }
}

function resolveInitialLocale(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LOCALES.some((l) => l.value === stored)) {
    return stored;
  }

  const detected = detectBrowserLocale();
  if (detected) {
    // Persist the auto-detected locale so it is sticky across visits
    localStorage.setItem(STORAGE_KEY, detected);
    return detected;
  }

  return DEFAULT_LOCALE;
}

/**
 * Match the browser's language preferences against the available locales.
 * Pass 1 prefers exact matches (case-insensitive), e.g. "de-AT" → "de-AT".
 * Pass 2 falls back to the base language, e.g. "de-AT" → "de-DE".
 */
function detectBrowserLocale(): string | null {
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const lang of browserLanguages) {
    const exact = LOCALES.find((l) => l.value.toLowerCase() === lang.toLowerCase());
    if (exact) {
      return exact.value;
    }
  }

  for (const lang of browserLanguages) {
    const base = lang.split("-")[0].toLowerCase();
    const partial = LOCALES.find((l) => l.value.split("-")[0].toLowerCase() === base);
    if (partial) {
      return partial.value;
    }
  }

  return null;
}
