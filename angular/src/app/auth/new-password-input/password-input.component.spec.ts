import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { form, required } from "@angular/forms/signals";
import { DomSanitizer } from "@angular/platform-browser";

import { MatIconRegistry } from "@angular/material/icon";
import { MatInputHarness } from "@angular/material/input/testing";

import { TranslateService, provideTranslateParser, provideTranslateService } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";

import { MealieParser } from "@app/locale/mealie-parser";
import { mockDomSanitizer } from "@testing/dom-sanitizer.mock";
import { mockSvgIcons } from "@testing/mock-icons.mock";

import NewPasswordInputComponent from "./password-input.component";

const SVG_ICONS = ["lock", "eye", "eye-off"];

@Component({
  template: `
    <mealie-new-password-input [passwordField]="passwordForm.password" [confirmField]="passwordForm.passwordConfirm" />
  `,
  imports: [NewPasswordInputComponent],
})
class TestHostComponent {
  protected passwordForm = form(signal({ password: "", passwordConfirm: "" }), (schemaPath) => {
    required(schemaPath.password);
    required(schemaPath.passwordConfirm);
  });
}

describe("NewPasswordInputComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        // Same parser as the app: Mealie translation files use single-brace interpolation
        provideTranslateService({ fallbackLang: "en-US", parser: provideTranslateParser(MealieParser) }),
        { provide: DomSanitizer, useValue: mockDomSanitizer },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation("en-US", {
      "user.password": "Password",
      "user.confirm-password": "Confirm Password",
      "user.hide-password": "Hide Password",
      "user.password-strength": "Password is {strength}",
      "user.password-strength-values.weak": "Weak",
      "user.password-strength-values.good": "Good",
      "user.password-strength-values.strong": "Strong",
      "user.password-strength-values.very-strong": "Very Strong",
    });
    await firstValueFrom(translate.use("en-US"));

    mockSvgIcons(TestBed.inject(MatIconRegistry), SVG_ICONS);

    fixture = TestBed.createComponent(TestHostComponent);
    await fixture.whenStable();

    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  const progressBar = () => fixture.nativeElement.querySelector("mat-progress-bar") as HTMLElement;
  const strengthText = () => fixture.nativeElement.querySelector("strong") as HTMLElement;

  const setPassword = async (value: string) => {
    const [passwordHarness] = await loader.getAllHarnesses(MatInputHarness);
    await passwordHarness.setValue(value);
    await fixture.whenStable();
  };

  it("should create", () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("should render the new password and confirm password inputs", async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(inputs).toHaveLength(2);

    const labels = Array.from(fixture.nativeElement.querySelectorAll("mat-label")) as HTMLElement[];
    expect(labels.map((el) => el.textContent)).toEqual(["Password", "Confirm Password"]);
  });

  it("should score an empty password as weak", () => {
    expect(progressBar().classList.contains("strength-weak")).toBe(true);
    expect(strengthText().textContent).toBe("Password is Weak");
    expect(progressBar().getAttribute("aria-label")).toBe("Password is Weak");
  });

  it("should update the strength when the password value changes", async () => {
    // 10 unique characters -> 50, digits + lowercase -> +10 = 60 (good)
    await setPassword("abcdef1234");

    expect(progressBar().classList.contains("strength-good")).toBe(true);
    expect(strengthText().textContent).toBe("Password is Good");

    // A flagged word scores 0 (weak)
    await setPassword("password123");

    expect(progressBar().classList.contains("strength-weak")).toBe(true);
    expect(strengthText().textContent).toBe("Password is Weak");

    // 32 unique characters with all four variations -> clamped to 100 (very strong)
    await setPassword("abcdefghijklmnopqrst1234XYZW!@#$");

    expect(progressBar().classList.contains("strength-very-strong")).toBe(true);
    expect(strengthText().textContent).toBe("Password is Very Strong");
  });

  it("should only score the new password, not the confirmation", async () => {
    const [, confirmHarness] = await loader.getAllHarnesses(MatInputHarness);
    await confirmHarness.setValue("abcdefghijklmnopqrst1234XYZW!@#$");

    expect(progressBar().classList.contains("strength-weak")).toBe(true);
  });
});
