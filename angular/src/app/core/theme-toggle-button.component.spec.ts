import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MatIconRegistry } from "@angular/material/icon";

import { TranslateService } from "@ngx-translate/core";

import { MockMatIconRegistry } from "@testing/mock-icons.mock";
import { mockTranslateService } from "@testing/translate-service.mock";
import { ThemeService } from "@theme/theme.service";

import ThemeToggleButton from "./theme-toggle-button.component";

class ThemeServiceStub {
  currentModeIcon = signal("theme-light-dark");
  currentModeTranslateKey = signal("settings.theme.auto-mode");
  cycle = vi.fn();
}

describe("ThemeToggleButton", () => {
  let fixture: ComponentFixture<ThemeToggleButton>;
  let themeService: ThemeServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleButton],
      providers: [
        { provide: ThemeService, useClass: ThemeServiceStub },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: MatIconRegistry, useValue: new MockMatIconRegistry() },
      ],
    }).compileComponents();

    themeService = TestBed.inject(ThemeService) as unknown as ThemeServiceStub;

    fixture = TestBed.createComponent(ThemeToggleButton);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display an icon for the current theme mode", () => {
    const icon = fixture.nativeElement.querySelector("mat-icon");
    expect(icon.querySelector("svg")).toBeTruthy();
  });

  it("should cycle theme when button is clicked", async () => {
    const button = fixture.nativeElement.querySelector("button");
    await button.click();
    await fixture.whenStable();
    expect(themeService.cycle).toHaveBeenCalled();
  });
});
