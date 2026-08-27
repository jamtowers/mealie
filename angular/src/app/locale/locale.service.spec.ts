import { TestBed } from "@angular/core/testing";

import { ITranslateService, TranslateService } from "@ngx-translate/core";
import { vi } from "vitest";

import { mockLocalStorage } from "@testing/local-storage.mock";

import { LOCALES } from "./available-locales";
import { LocaleService } from "./locale.service";

const fakeTranslate: Partial<ITranslateService> = {
  addLangs: vi.fn(),
  use: vi.fn(),
};

/**
 * Create a `LocaleService` seeded with an optional stored locale and browser languages.
 * Locale resolution happens during construction, so tests that exercise detection
 * get a fresh instance via `runInInjectionContext` instead of resetting the
 * `TestBed` module.
 */
function createService(storedLocale?: string, languages: string[] = []): LocaleService {
  if (storedLocale) {
    localStorage.setItem("mealie-language", storedLocale);
  }
  vi.stubGlobal("navigator", { languages, language: languages[0] ?? "" });
  return TestBed.runInInjectionContext(() => new LocaleService());
}

describe("LocaleService", () => {
  let service: LocaleService;
  let translate: TranslateService;

  beforeEach(() => {
    mockLocalStorage();

    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: fakeTranslate }],
    });

    service = createService();
    translate = TestBed.inject(TranslateService);

    service.initialize();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("initialization", () => {
    it("should use the stored locale if it is a valid value", () => {
      expect(createService("de-DE", ["en-US"]).locale()).toBe("de-DE");
    });

    it("should ignore an invalid stored locale and fall through detection", () => {
      expect(createService("xx-XX").locale()).toBe("en-US");
    });

    it("should detect browser locale via exact match", () => {
      const detected = createService(undefined, ["fr-FR"]);
      expect(detected.locale()).toBe("fr-FR");
      expect(localStorage.getItem("mealie-language")).toBe("fr-FR");
    });

    it("should detect browser locale via base language fallback", () => {
      expect(createService(undefined, ["de-AT"]).locale()).toBe("de-DE");
    });

    it("should fall back to en-US when no match exists", () => {
      expect(createService(undefined, ["xx-XX"]).locale()).toBe("en-US");
    });

    it("should register all locales with TranslateService", () => {
      service.initialize();
      expect(translate.addLangs).toHaveBeenCalledWith(LOCALES.map((l) => l.value));
    });

    it("should apply the initial locale to TranslateService and the document", () => {
      service.initialize();
      expect(translate.use).toHaveBeenCalledWith("en-US");
      expect(document.documentElement.lang).toBe("en-US");
      expect(document.documentElement.dir).toBe("ltr");
    });
  });

  describe("currentLocaleName", () => {
    it("should return the display name of the active locale", () => {
      service.setLocale("de-DE");
      expect(service.currentLocaleName()).toBe("Deutsch (German)");
    });

    it("should fall back to the raw code for an unknown locale", () => {
      service.setLocale("unknown");
      expect(service.currentLocaleName()).toBe("unknown");
    });
  });

  describe("setLocale", () => {
    it("should update the locale signal", () => {
      service.setLocale("fr-FR");
      expect(service.locale()).toBe("fr-FR");
    });

    it("should persist the locale to localStorage", () => {
      service.setLocale("es-ES");
      expect(localStorage.getItem("mealie-language")).toBe("es-ES");
    });

    it("should apply the new locale to TranslateService", () => {
      service.setLocale("ja-JP");
      expect(translate.use).toHaveBeenCalledWith("ja-JP");
    });

    it("should set the document lang attribute", () => {
      service.setLocale("pt-BR");
      expect(document.documentElement.lang).toBe("pt-BR");
    });

    it("should set RTL direction for RTL locales", () => {
      service.setLocale("ar-SA");
      expect(document.documentElement.dir).toBe("rtl");
    });

    it("should set LTR direction for LTR locales", () => {
      service.setLocale("en-US");
      expect(document.documentElement.dir).toBe("ltr");
    });
  });
});
