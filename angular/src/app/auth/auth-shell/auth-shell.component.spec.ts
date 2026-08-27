import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";

import { MatIconRegistry } from "@angular/material/icon";

import { TranslateService, provideTranslateService } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";

import { mockDomSanitizer } from "@testing/dom-sanitizer.mock";
import { mockLocalStorage } from "@testing/local-storage.mock";
import { mockSvgIcons } from "@testing/mock-icons.mock";

import AuthShellComponent from "./auth-shell.component";

const SVG_ICONS = ["arrow-left", "translate", "theme-light-dark"];

@Component({
  template: `
    <mealie-auth-shell [backButton]="backButton()">
      <div id="banner-card">Banner content</div>
      <main>Main content</main>
      <footer>Footer content</footer>
    </mealie-auth-shell>
  `,
  imports: [AuthShellComponent],
})
class TestHostComponent {
  protected readonly backButton = signal(false);
}

describe("AuthShellComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    // The shell renders the theme toggle, whose root service reads localStorage
    mockLocalStorage();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ fallbackLang: "en-US" }),
        { provide: DomSanitizer, useValue: mockDomSanitizer },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation("en-US", {
      "general.back": "Back",
      "sidebar.language": "Language",
      "settings.theme.auto-mode": "Auto Mode",
    });
    await firstValueFrom(translate.use("en-US"));

    mockSvgIcons(TestBed.inject(MatIconRegistry), SVG_ICONS);

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(host).toBeTruthy();
  });

  it("should render the card with the Mealie title", () => {
    expect(fixture.nativeElement.querySelector("mat-card-title")?.textContent).toBe("Mealie");
  });

  it("should not render the back button by default", () => {
    expect(fixture.nativeElement.querySelector("mat-card-header a")).toBeNull();
  });

  it("should render the back button when backButton is true", () => {
    host["backButton"].set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector("mat-card-header a")).not.toBeNull();
  });

  it("should project the banner, main and footer content", () => {
    expect(fixture.nativeElement.querySelector("#banner-card")?.textContent).toBe("Banner content");
    expect(fixture.nativeElement.querySelector("main")?.textContent).toBe("Main content");
    expect(fixture.nativeElement.querySelector("footer")?.textContent).toBe("Footer content");
  });

  it("should render the language and theme toggle buttons", () => {
    expect(fixture.nativeElement.querySelector("mealie-language-button")).not.toBeNull();
    expect(fixture.nativeElement.querySelector("mealie-theme-toggle-button")).not.toBeNull();
  });
});
