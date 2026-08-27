import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatAutocompleteHarness } from "@angular/material/autocomplete/testing";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";

import { TranslateService } from "@ngx-translate/core";
import { Subject } from "rxjs";
import { vi } from "vitest";

import { MockMatIconRegistry } from "@testing/mock-icons.mock";
import { mockTranslateService } from "@testing/translate-service.mock";

import { LOCALES } from "./available-locales";
import LanguageDialogComponent from "./language-dialog.component";
import { LocaleService } from "./locale.service";

class MockLocaleService {
  readonly locale = signal("en-US");
  readonly currentLocaleName = signal("American English");

  setLocale = vi.fn();
}

async function createComponent(): Promise<{
  fixture: ComponentFixture<LanguageDialogComponent>;
  localeService: LocaleService;
  dialogRef: MatDialogRef<LanguageDialogComponent>;
  beforeClosed: Subject<void>;
}> {
  const beforeClosed = new Subject<void>();

  await TestBed.configureTestingModule({
    imports: [MatAutocompleteModule, MatDialogModule, MatIconModule, MatInputModule, LanguageDialogComponent],
    providers: [
      { provide: LocaleService, useClass: MockLocaleService },
      { provide: TranslateService, useValue: mockTranslateService },
      {
        provide: MatDialogRef,
        useValue: { close: vi.fn(), beforeClosed: vi.fn(() => beforeClosed.asObservable()) },
      },
      { provide: MatIconRegistry, useValue: new MockMatIconRegistry() },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(LanguageDialogComponent);
  await fixture.whenStable();

  const localeService = TestBed.inject(LocaleService) as unknown as LocaleService;
  const dialogRef = TestBed.inject(MatDialogRef);

  return { fixture, localeService, dialogRef, beforeClosed };
}

describe("LanguageDialogComponent", () => {
  let fixture: ComponentFixture<LanguageDialogComponent>;
  let localeService: MockLocaleService;
  let dialogRef: MatDialogRef<LanguageDialogComponent>;
  let beforeClosed: Subject<void>;
  let harness: MatAutocompleteHarness;
  let inputElement: HTMLInputElement;

  beforeEach(async () => {
    const setup = await createComponent();
    fixture = setup.fixture;
    localeService = TestBed.inject(LocaleService) as unknown as MockLocaleService;
    dialogRef = setup.dialogRef;
    beforeClosed = setup.beforeClosed;
    fixture.detectChanges();
    inputElement = fixture.nativeElement.querySelector("input") as HTMLInputElement;
    harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatAutocompleteHarness);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Focusing the input opens the panel, which the component closes immediately on
   * the first open; clicking the input reopens it.
   */
  async function primeAndOpen(): Promise<void> {
    await harness.focus();
    await fixture.whenStable();
    inputElement.click();
    await fixture.whenStable();
  }

  /** Closes the panel without selecting an option, as a user would (click outside). */
  function closePanelWithoutSelection(): void {
    inputElement.blur();
    document.body.click();
  }

  describe("initial state", () => {
    it("initializes the input with the current locale name", async () => {
      expect(await harness.getValue()).toBe("American English");
    });
  });

  describe("autocomplete panel", () => {
    it("closes the panel on the first focus", async () => {
      await harness.focus();
      await fixture.whenStable();

      expect(await harness.isOpen()).toBe(false);
    });

    it("shows all locales on the next open without any typing", async () => {
      await primeAndOpen();

      expect(await harness.isOpen()).toBe(true);
      const options = await harness.getOptions();
      expect(options.length).toBe(LOCALES.length);
    });

    it("filters the options as the user types", async () => {
      await primeAndOpen();

      // The user clears the pre-filled locale name before typing a search
      await harness.clear();
      await harness.enterText("French");
      await fixture.whenStable();

      const options = await harness.getOptions();
      expect(options.length).toBeGreaterThan(0);
      for (const option of options) {
        const text = await option.getText();
        expect(text.toLowerCase()).toContain("french");
      }
    });

    it("resets the query to the current locale name when the panel closes without a selection", async () => {
      await primeAndOpen();

      await harness.clear();
      await harness.enterText("German");
      await fixture.whenStable();
      expect(await harness.isOpen()).toBe(true);

      closePanelWithoutSelection();
      await fixture.whenStable();

      expect(await harness.isOpen()).toBe(false);
      expect(await harness.getValue()).toBe("American English");
    });
  });

  describe("locale selection", () => {
    it("applies the selected locale and closes the dialog when it is not the active one", async () => {
      await primeAndOpen();

      await harness.clear();
      await harness.enterText("German");
      await fixture.whenStable();
      // String text filters are exact matches; use a regex for a partial match
      await harness.selectOption({ text: /German/ });
      await fixture.whenStable();

      expect(await harness.isOpen()).toBe(false);
      expect(await harness.getValue()).toBe("Deutsch (German)");
      expect(localeService.setLocale).toHaveBeenCalledWith("de-DE");
      expect(dialogRef.close).toHaveBeenCalled();
    });

    it("keeps the dialog open when the active locale is selected", async () => {
      await primeAndOpen();

      await harness.clear();
      await harness.enterText("English");
      await fixture.whenStable();
      await harness.selectOption({ text: /American English/ });
      await fixture.whenStable();

      expect(await harness.isOpen()).toBe(false);
      expect(await harness.getValue()).toBe("American English");
      expect(localeService.setLocale).not.toHaveBeenCalled();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe("while the dialog is closing", () => {
    it("does not reopen the panel", async () => {
      // Prime the panel so this is not the first open
      await harness.focus();
      await fixture.whenStable();

      beforeClosed.next(undefined);
      await fixture.whenStable();

      inputElement.click();
      await fixture.whenStable();

      expect(await harness.isOpen()).toBe(false);
    });

    it("does not reopen the panel when the input is refocused while the dialog is closing", async () => {
      // Prime the panel so this is not the first open
      await harness.focus();
      await fixture.whenStable();

      // A plain refocus reopens the panel — the teardown refocus will do the same
      inputElement.blur();
      inputElement.focus();
      await fixture.whenStable();
      expect(await harness.isOpen()).toBe(true);

      closePanelWithoutSelection();
      await fixture.whenStable();

      // The dialog starts closing before change detection disables the trigger,
      // and the teardown refocuses the input in that window
      beforeClosed.next(undefined);
      inputElement.blur();
      inputElement.focus();

      // The refocus opens the panel, and the component closes it again before
      // anything renders. Query the panel DOM directly: once the trigger is
      // disabled, the harness's isOpen() can no longer locate the panel (it
      // resolves it via the input's aria-controls, which is null when disabled).
      const panelElement = document.querySelector(".mat-mdc-autocomplete-panel");
      expect(panelElement?.classList.contains("mat-mdc-autocomplete-visible")).toBeFalsy();
    });
  });

  describe("cancel button", () => {
    it("closes the dialog", () => {
      const cancelButton = fixture.nativeElement.querySelector("mat-dialog-actions button") as HTMLButtonElement;

      cancelButton.click();

      expect(dialogRef.close).toHaveBeenCalled();
    });
  });
});
