import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormField, email, form, required, submit } from "@angular/forms/signals";

import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatInputHarness } from "@angular/material/input/testing";

import { TranslateService } from "@ngx-translate/core";

import { mockTranslateService } from "@testing/translate-service.mock";

import { ValidationErrorDirective } from "./validation-error.directive";

@Component({
  template: `
    <form (submit)="onSubmit($event)">
      <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput [formField]="emailForm.email" />
        <mat-error mealieValidationError [field]="emailForm.email" />
      </mat-form-field>
      <button type="submit">Send</button>
    </form>
  `,
  imports: [MatFormFieldModule, MatInputModule, FormField, ValidationErrorDirective],
})
class TestHostComponent {
  protected emailForm = form(signal({ email: "" }), (schemaPath) => {
    required(schemaPath.email);
    email(schemaPath.email);
  });

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.emailForm, async () => null);
  }
}

describe("ValidationErrorDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: TranslateService, useValue: mockTranslateService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    await fixture.whenStable();
  });

  const errorText = () => fixture.nativeElement.querySelector("mat-error")?.textContent.trim() ?? "";

  const submitForm = async () => {
    fixture.nativeElement.querySelector("form").dispatchEvent(new Event("submit"));
    await fixture.whenStable();
  };

  const setInputValue = async (value: string) => {
    const harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatInputHarness);
    await harness.setValue(value);
  };

  it("should not show an error initially", () => {
    expect(errorText()).toBe("");
  });

  it("should show the required error when submitting an empty form", async () => {
    await submitForm();

    expect(errorText()).toBe("[validators.required]");
  });

  it("should show the email error for an invalid email address", async () => {
    await setInputValue("not-an-email");
    await submitForm();

    expect(errorText()).toBe("[validators.invalid-email]");
  });

  it("should not show an error for a valid email address", async () => {
    await setInputValue("user@example.com");
    await submitForm();

    expect(errorText()).toBe("");
  });
});
