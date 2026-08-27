import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { MatIconRegistry } from "@angular/material/icon";

import { TranslateService } from "@ngx-translate/core";

import { mockLocalStorage } from "@testing/local-storage.mock";
import { MockMatIconRegistry } from "@testing/mock-icons.mock";
import { mockTranslateService } from "@testing/translate-service.mock";

import AuthShellComponent from "./auth-shell.component";

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
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: MatIconRegistry, useValue: new MockMatIconRegistry() },
      ],
    }).compileComponents();

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
