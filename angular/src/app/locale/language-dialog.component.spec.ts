import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";

import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from "@angular/material/autocomplete";
import { MatAutocompleteHarness } from "@angular/material/autocomplete/testing";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatInputHarness } from "@angular/material/input/testing";

import { TranslateService, provideTranslateService } from "@ngx-translate/core";
import { Subject } from "rxjs";
import { vi } from "vitest";

import { mockDomSanitizer } from "@testing/dom-sanitizer.mock";
import { mockSvgIcons } from "@testing/mock-icons.mock";

import { LOCALES } from "./available-locales";
import LanguageDialogComponent from "./language-dialog.component";
import { LocaleService } from "./locale.service";

const SVG_ICONS = ["translate"];

// Access protected members via type cast
const componentAccess = (
  c: LanguageDialogComponent,
): Omit<LanguageDialogComponent, never> & {
  onPanelOpened: (trigger: MatAutocompleteTrigger) => void;
  onPanelClosing: () => void;
  onQueryInput: (event: Event) => void;
  onLocaleSelected: (event: MatAutocompleteSelectedEvent) => void;
} =>
  c as unknown as LanguageDialogComponent & {
    onPanelOpened: (trigger: MatAutocompleteTrigger) => void;
    onPanelClosing: () => void;
    onQueryInput: (event: Event) => void;
    onLocaleSelected: (event: MatAutocompleteSelectedEvent) => void;
  };

class MockLocaleService {
  readonly locale = signal("en-US");
  readonly currentLocaleName = signal("American English");

  setLocale = vi.fn();
}

class MockTranslateService {
  // no-op
}

function createMockTrigger(): MatAutocompleteTrigger {
  return { closePanel: vi.fn() } as unknown as MatAutocompleteTrigger;
}

function createMockEvent(locale: (typeof LOCALES)[number]): MatAutocompleteSelectedEvent {
  return {
    option: { value: locale },
  } as unknown as MatAutocompleteSelectedEvent;
}

function createInputEvent(value: string): Event {
  return {
    target: { value },
  } as unknown as Event;
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
      { provide: TranslateService, useClass: MockTranslateService },
      {
        provide: MatDialogRef,
        useValue: { close: vi.fn(), beforeClosed: vi.fn(() => beforeClosed.asObservable()) },
      },
      provideTranslateService({ fallbackLang: "en-US" }),
      { provide: DomSanitizer, useValue: mockDomSanitizer },
    ],
  }).compileComponents();

  mockSvgIcons(TestBed.inject(MatIconRegistry), SVG_ICONS);

  const fixture = TestBed.createComponent(LanguageDialogComponent);
  await fixture.whenStable();

  const localeService = TestBed.inject(LocaleService) as unknown as LocaleService;
  const dialogRef = TestBed.inject(MatDialogRef);

  return { fixture, localeService, dialogRef, beforeClosed };
}

describe("LanguageDialogComponent", () => {
  let fixture: ComponentFixture<LanguageDialogComponent>;
  let component: LanguageDialogComponent;
  let loader: HarnessLoader;
  let localeService: MockLocaleService;
  let dialogRef: MatDialogRef<LanguageDialogComponent>;
  let beforeClosed: Subject<void>;

  beforeEach(async () => {
    const setup = await createComponent();
    fixture = setup.fixture;
    component = fixture.componentInstance;
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
    localeService = TestBed.inject(LocaleService) as unknown as MockLocaleService;
    dialogRef = setup.dialogRef;
    beforeClosed = setup.beforeClosed;
  });

  describe("initial state", () => {
    it("initializes query with the current locale name", async () => {
      await fixture.whenStable();

      expect(component["query"]()).toBe(component["localeService"].currentLocaleName());
    });
  });

  describe("filteredLocales", () => {
    it("returns empty array before the panel has been opened", async () => {
      await fixture.whenStable();

      expect(component["filteredLocales"]()).toEqual([]);
    });

    it("returns all locales after the panel opens once but before any interaction", async () => {
      await fixture.whenStable();

      const trigger = createMockTrigger();
      componentAccess(component).onPanelOpened(trigger);

      await fixture.whenStable();

      expect(component["filteredLocales"]()).toEqual(LOCALES);
    });

    it("returns fuse search results after the user types", async () => {
      await fixture.whenStable();

      const trigger1 = createMockTrigger();
      componentAccess(component).onPanelOpened(trigger1);
      await fixture.whenStable();

      const trigger2 = createMockTrigger();
      componentAccess(component).onPanelOpened(trigger2);
      await fixture.whenStable();
      expect(component["filteredLocales"]()).toEqual(LOCALES);

      componentAccess(component).onQueryInput(createInputEvent("French"));
      await fixture.whenStable();

      const results = component["filteredLocales"]();
      expect(results.length).toBeGreaterThan(0);
      for (const locale of results) {
        expect(locale.name.toLowerCase()).toContain("french");
      }
    });
  });

  describe("onPanelOpened", () => {
    it("closes the panel on the first focus and sets hasOpened", async () => {
      await fixture.whenStable();

      const trigger = createMockTrigger();
      componentAccess(component).onPanelOpened(trigger);

      expect(trigger.closePanel).toHaveBeenCalled();
      expect(component["hasOpened"]()).toBe(true);
    });

    it("does not close the panel on subsequent opens and resets hasSelected", async () => {
      await fixture.whenStable();

      const trigger1 = createMockTrigger();
      componentAccess(component).onPanelOpened(trigger1);
      await fixture.whenStable();

      component["hasSelected"].set(true);

      const trigger2 = createMockTrigger();
      componentAccess(component).onPanelOpened(trigger2);

      expect(trigger2.closePanel).not.toHaveBeenCalled();
      expect(component["hasSelected"]()).toBe(false);
    });
  });

  describe("onPanelClosing", () => {
    it("resets query to current locale name when no option was selected", async () => {
      await fixture.whenStable();

      component["query"].set("some search text");
      component["hasInteracted"].set(true);
      component["hasSelected"].set(false);
      await fixture.whenStable();

      componentAccess(component).onPanelClosing();

      expect(component["query"]()).toBe(component["localeService"].currentLocaleName());
    });

    it("keeps the query unchanged when an option was selected", async () => {
      await fixture.whenStable();

      component["query"].set("French");
      component["hasSelected"].set(true);
      await fixture.whenStable();

      componentAccess(component).onPanelClosing();

      expect(component["query"]()).toBe("French");
    });
  });

  describe("onQueryInput", () => {
    it("sets hasInteracted and updates the query signal", async () => {
      await fixture.whenStable();

      expect(component["hasInteracted"]()).toBe(false);

      componentAccess(component).onQueryInput(createInputEvent("German"));

      expect(component["hasInteracted"]()).toBe(true);
      expect(component["query"]()).toBe("German");
    });
  });

  describe("onLocaleSelected", () => {
    it("does not close the dialog when selecting the active locale", async () => {
      await fixture.whenStable();

      const activeLocale = LOCALES.find((l) => l.value === "en-US")!;
      const event = createMockEvent(activeLocale);

      componentAccess(component).onLocaleSelected(event);

      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it("closes the dialog and sets the locale when selecting a different locale", async () => {
      await fixture.whenStable();

      localeService.locale.set("en-US");

      const newLocale = LOCALES.find((l) => l.value === "de-DE")!;
      const event = createMockEvent(newLocale);

      componentAccess(component).onLocaleSelected(event);

      expect(dialogRef.close).toHaveBeenCalled();
      expect(component["query"]()).toBe(newLocale.name);
    });
  });

  describe("isClosing", () => {
    it("is set when the dialog starts closing", () => {
      expect(component["isClosing"]()).toBe(false);

      beforeClosed.next(undefined);

      expect(component["isClosing"]()).toBe(true);
    });

    it("closes the panel instead of reopening it while the dialog is closing", async () => {
      await fixture.whenStable();

      // Prime the panel so this is not the first open
      componentAccess(component).onPanelOpened(createMockTrigger());
      await fixture.whenStable();

      beforeClosed.next(undefined);

      const trigger = createMockTrigger();
      componentAccess(component).onPanelOpened(trigger);

      expect(trigger.closePanel).toHaveBeenCalled();
    });
  });

  describe("template event handlers", () => {
    it("should trigger onQueryInput via the input element", async () => {
      await fixture.whenStable();

      const trigger1 = createMockTrigger();
      componentAccess(component).onPanelOpened(trigger1);
      await fixture.whenStable();

      const trigger2 = createMockTrigger();
      componentAccess(component).onPanelOpened(trigger2);
      await fixture.whenStable();

      const inputEl = fixture.nativeElement.querySelector("mat-form-field input") as HTMLInputElement;
      inputEl.value = "French";
      inputEl.dispatchEvent(new Event("input"));
      await fixture.whenStable();

      expect(component["hasInteracted"]()).toBe(true);
      expect(component["query"]()).toBe("French");
    });

    it("should trigger onPanelOpened via the autocomplete", async () => {
      await fixture.whenStable();

      // Simulate the (opened) event by focusing the trigger input
      const inputEl = fixture.nativeElement.querySelector("mat-form-field input") as HTMLInputElement;
      inputEl.focus();
      await fixture.whenStable();

      // First focus should set hasOpened
      expect(component["hasOpened"]()).toBe(true);
    });

    it("should trigger onLocaleSelected via selecting an autocomplete option", async () => {
      // Prevent dialogRef.close from actually closing the dialog
      const closeSpy = vi.spyOn(dialogRef, "close").mockImplementation(vi.fn());

      await fixture.whenStable();

      // Prime the panel so it stays open on the next open
      componentAccess(component).onPanelOpened(createMockTrigger());
      await fixture.whenStable();

      const inputHarness = await loader.getHarness(MatInputHarness);
      await inputHarness.focus();
      await fixture.whenStable();

      const autocompleteHarness = await loader.getHarness(MatAutocompleteHarness);
      const options = await autocompleteHarness.getOptions();
      const deLocale = LOCALES.find((l) => l.value === "de-DE")!;

      // Iterate to find the right option (async find doesn't work)
      let targetOption;
      for (const opt of options) {
        const text = await opt.getText();
        if (text.includes(deLocale.name)) {
          targetOption = opt;
          break;
        }
      }

      await targetOption!.click();
      await fixture.whenStable();

      expect(closeSpy).toHaveBeenCalled();
      expect(localeService.setLocale).toHaveBeenCalledWith(deLocale.value);
    });
  });
});
