import { Injectable, computed, signal } from "@angular/core";

type ThemeMode = "light" | "dark" | "auto";

/** Storage key for theme state */
const STORAGE_KEY = "mealie-theme";

/** Cycle order: light → dark → auto → light … */
const MODE_CYCLE: readonly ThemeMode[] = ["light", "dark", "auto"];

@Injectable({ providedIn: "root" })
export class ThemeService {
  private mode = signal<ThemeMode>(loadFromStorage() ?? "auto");

  currentModeIcon = computed(() => {
    switch (this.mode()) {
      case "light":
        return "weather-sunny";
      case "dark":
        return "weather-night";
      case "auto":
      default:
        return "theme-light-dark";
    }
  });

  currentModeTranslateKey = computed(() => {
    switch (this.mode()) {
      case "light":
        return "settings.theme.light-mode";
      case "dark":
        return "settings.theme.dark-mode";
      case "auto":
      default:
        return "settings.theme.auto-mode";
    }
  });

  initialize() {
    applyMode(this.mode());
  }

  /** Cycle to the next mode: light → dark → auto → light … */
  cycle(): void {
    const current = this.mode();
    const index = MODE_CYCLE.indexOf(current);
    const next = MODE_CYCLE[(index + 1) % MODE_CYCLE.length];
    this.set(next);
  }

  /** Set a specific mode. */
  set(mode: ThemeMode): void {
    this.mode.set(mode);
    this.save();
  }

  private save(): void {
    applyMode(this.mode());
    localStorage.setItem(STORAGE_KEY, this.mode());
  }
}

function applyMode(mode: ThemeMode): void {
  document.documentElement.style.colorScheme = mode === "auto" ? "light dark" : mode;
}

function loadFromStorage(): ThemeMode | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return MODE_CYCLE.some((m) => m === stored) ? (stored as ThemeMode) : null;
}
