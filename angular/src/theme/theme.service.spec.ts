import { TestBed } from "@angular/core/testing";

import { mockLocalStorage } from "@testing/local-storage.mock";

import { ThemeService } from "./theme.service";

/**
 * Create a `ThemeService` seeded with an optional stored mode.
 * The mode is resolved during construction, so constructor tests get a fresh
 * instance instead of resetting the `TestBed` module.
 */
function createService(storedMode?: string): ThemeService {
  if (storedMode) {
    localStorage.setItem("mealie-theme", storedMode);
  }
  return new ThemeService();
}

describe("ThemeService", () => {
  let service: ThemeService;

  beforeEach(() => {
    mockLocalStorage();

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });

    service = TestBed.inject(ThemeService);

    service.initialize();
  });

  describe("currentModeIcon", () => {
    it("returns sunny icon for light mode", () => {
      service.set("light");
      expect(service.currentModeIcon()).toBe("weather-sunny");
    });

    it("returns night icon for dark mode", () => {
      service.set("dark");
      expect(service.currentModeIcon()).toBe("weather-night");
    });

    it("returns theme-light-dark icon for auto mode", () => {
      service.set("auto");
      expect(service.currentModeIcon()).toBe("theme-light-dark");
    });
  });

  describe("currentModeTranslateKey", () => {
    it("returns light-mode key for light mode", () => {
      service.set("light");
      expect(service.currentModeTranslateKey()).toBe("settings.theme.light-mode");
    });

    it("returns dark-mode key for dark mode", () => {
      service.set("dark");
      expect(service.currentModeTranslateKey()).toBe("settings.theme.dark-mode");
    });

    it("returns auto-mode key for auto mode", () => {
      service.set("auto");
      expect(service.currentModeTranslateKey()).toBe("settings.theme.auto-mode");
    });
  });

  describe("cycle", () => {
    it("cycles from light to dark", () => {
      service.set("light");
      service.cycle();
      expect(localStorage.getItem("mealie-theme")).toBe("dark");
    });

    it("cycles from dark to auto", () => {
      service.set("dark");
      service.cycle();
      expect(localStorage.getItem("mealie-theme")).toBe("auto");
    });

    it("cycles from auto back to light", () => {
      service.set("auto");
      service.cycle();
      expect(localStorage.getItem("mealie-theme")).toBe("light");
    });
  });

  describe("set", () => {
    it("persists mode to localStorage", () => {
      service.set("dark");
      expect(localStorage.getItem("mealie-theme")).toBe("dark");
    });

    it("updates the icon computed signal", () => {
      service.set("dark");
      expect(service.currentModeIcon()).toBe("weather-night");
    });
  });

  describe("constructor", () => {
    it("defaults to auto when localStorage is empty", () => {
      expect(service.currentModeIcon()).toBe("theme-light-dark");
    });

    it("loads mode from localStorage", () => {
      expect(createService("dark").currentModeIcon()).toBe("weather-night");
    });

    it("ignores invalid localStorage values and defaults to auto", () => {
      expect(createService("invalid").currentModeIcon()).toBe("theme-light-dark");
    });
  });

  describe("applyMode", () => {
    it("sets colorScheme to light for light mode", () => {
      service.set("light");
      expect(document.documentElement.style.colorScheme).toBe("light");
    });

    it("sets colorScheme to dark for dark mode", () => {
      service.set("dark");
      expect(document.documentElement.style.colorScheme).toBe("dark");
    });

    it("sets colorScheme to 'light dark' for auto mode", () => {
      service.set("auto");
      expect(document.documentElement.style.colorScheme).toBe("light dark");
    });
  });
});
