import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { form, required } from "@angular/forms/signals";

import { MatIconRegistry } from "@angular/material/icon";
import { MatInputHarness } from "@angular/material/input/testing";

import { TranslateService } from "@ngx-translate/core";

import { MockMatIconRegistry } from "@testing/mock-icons.mock";
import { mockTranslateService } from "@testing/translate-service.mock";

import NewPasswordInputComponent from "./password-input.component";

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
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: MatIconRegistry, useValue: new MockMatIconRegistry() },
      ],
    }).compileComponents();

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
    expect(labels.map((el) => el.textContent)).toEqual(["[user.password]", "[user.confirm-password]"]);
  });

  it("should score an empty password as weak", () => {
    expect(progressBar().classList.contains("strength-weak")).toBe(true);
    expect(strengthText().textContent).toBe("[user.password-strength]");
    expect(progressBar().getAttribute("aria-label")).toBe("[user.password-strength]");
  });

  it("should update the strength when the password value changes", async () => {
    // 10 unique characters -> 50, digits + lowercase -> +10 = 60 (good)
    await setPassword("abcdef1234");

    expect(progressBar().classList.contains("strength-good")).toBe(true);

    // A flagged word scores 0 (weak)
    await setPassword("password123");

    expect(progressBar().classList.contains("strength-weak")).toBe(true);

    // 32 unique characters with all four variations -> clamped to 100 (very strong)
    await setPassword("abcdefghijklmnopqrst1234XYZW!@#$");

    expect(progressBar().classList.contains("strength-very-strong")).toBe(true);
  });

  it("should only score the new password, not the confirmation", async () => {
    const [, confirmHarness] = await loader.getAllHarnesses(MatInputHarness);
    await confirmHarness.setValue("abcdefghijklmnopqrst1234XYZW!@#$");

    expect(progressBar().classList.contains("strength-weak")).toBe(true);
  });
});
