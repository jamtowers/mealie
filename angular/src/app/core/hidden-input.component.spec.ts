import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormField, form, required, submit } from "@angular/forms/signals";

import { MatIconRegistry } from "@angular/material/icon";
import { MatInputHarness } from "@angular/material/input/testing";

import { TranslateService } from "@ngx-translate/core";

import { MockMatIconRegistry } from "@testing/mock-icons.mock";
import { mockTranslateService } from "@testing/translate-service.mock";

import { HiddenInputComponent } from "./hidden-input.component";

@Component({
  template: `
    <form (submit)="onSubmit($event)">
      <mealie-hidden-input [formField]="passwordForm.password" label="user.password" />
    </form>
  `,
  imports: [FormField, HiddenInputComponent],
})
class TestHostComponent {
  protected passwordForm = form(signal({ password: "" }), (schemaPath) => {
    required(schemaPath.password);
  });

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.passwordForm, async () => null);
  }
}

describe("HiddenInputComponent", () => {
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

  const inputEl = () => fixture.nativeElement.querySelector("mealie-hidden-input input") as HTMLInputElement;
  const toggleBtn = () =>
    fixture.nativeElement.querySelector("mat-form-field button[maticonbutton]") as HTMLButtonElement;

  const submitForm = async () => {
    fixture.nativeElement.querySelector("form").dispatchEvent(new Event("submit"));
    await fixture.whenStable();
  };

  it("should create", () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("should render the label from the translate key", () => {
    expect(fixture.nativeElement.querySelector("mat-label")?.textContent).toBe("[user.password]");
  });

  it("should hide the password value initially", () => {
    expect(inputEl().type).toBe("password");
    expect(toggleBtn().getAttribute("aria-pressed")).toBe("true");
    expect(toggleBtn().getAttribute("aria-label")).toBe("[user.hide-password]");
  });

  it("should toggle password visibility", async () => {
    await toggleBtn().click();
    await fixture.whenStable();

    expect(inputEl().type).toBe("text");
    expect(toggleBtn().getAttribute("aria-pressed")).toBe("false");

    await toggleBtn().click();
    await fixture.whenStable();

    expect(inputEl().type).toBe("password");
    expect(toggleBtn().getAttribute("aria-pressed")).toBe("true");
  });

  it("should show the required error when submitting an empty form", async () => {
    await submitForm();

    const error = fixture.nativeElement.querySelector("mat-error");
    expect(error.textContent).toBe("[validators.required]");
  });

  it("should not show an error for a non-empty value", async () => {
    const harness = await loader.getHarness(MatInputHarness);
    await harness.setValue("secret");

    await submitForm();

    const error = fixture.nativeElement.querySelector("mat-error");
    expect(error?.textContent ?? "").toBe("");
  });
});
