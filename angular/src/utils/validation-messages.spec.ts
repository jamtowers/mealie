import { Component, Injector, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  EmailValidationError,
  MaxLengthValidationError,
  MinLengthValidationError,
  RequiredValidationError,
  type ValidationError,
  form,
} from "@angular/forms/signals";

import { TranslateService } from "@ngx-translate/core";

import { mockTranslateService } from "@testing/translate-service.mock";

import { firstErrorMessage, url, urlOptional, validationErrorI18n, whitespace } from "./validation-messages";

/** A host component to obtain a real injector for signal forms in unit tests. */
@Component({ template: "" })
class HostComponent {}

async function createTestInjector(): Promise<Injector> {
  await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  return TestBed.createComponent(HostComponent).componentRef.injector;
}

describe("validationErrorI18n", () => {
  it("should map a required error", () => {
    const error: ValidationError = new RequiredValidationError();

    expect(validationErrorI18n(error)).toEqual({ key: "validators.required" });
  });

  it("should map an email error", () => {
    const error: ValidationError = new EmailValidationError();

    expect(validationErrorI18n(error)).toEqual({ key: "validators.invalid-email" });
  });

  it("should map a min length error with the min param", () => {
    const error: ValidationError = new MinLengthValidationError(3);

    expect(validationErrorI18n(error)).toEqual({ key: "validators.min-length", params: { min: 3 } });
  });

  it("should map a max length error with the max param", () => {
    const error: ValidationError = new MaxLengthValidationError(3);

    expect(validationErrorI18n(error)).toEqual({ key: "validators.max-length", params: { max: 3 } });
  });

  it("should map a whitespace error", () => {
    const error: ValidationError = { kind: "whitespace" };

    expect(validationErrorI18n(error)).toEqual({ key: "validators.no-whitespace" });
  });

  it("should map a url error", () => {
    const error: ValidationError = { kind: "url" };

    expect(validationErrorI18n(error)).toEqual({ key: "validators.invalid-url" });
  });

  it("should map a password match error", () => {
    const error: ValidationError = { kind: "match" };

    expect(validationErrorI18n(error)).toEqual({ key: "user.password-must-match" });
  });

  it("should return undefined for unmapped errors", () => {
    expect(validationErrorI18n({ kind: "unknown" })).toBeUndefined();
  });
});

describe("firstErrorMessage", () => {
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: mockTranslateService }],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
  });

  it("should return null when there are no errors", () => {
    expect(firstErrorMessage(translate, [])).toBeNull();
  });

  it("should return the translated required message", () => {
    expect(firstErrorMessage(translate, [new RequiredValidationError()])).toBe("[validators.required]");
  });

  it("should return the min length message", () => {
    expect(firstErrorMessage(translate, [new MinLengthValidationError(3)])).toBe("[validators.min-length]");
  });

  it("should return the max length message", () => {
    expect(firstErrorMessage(translate, [new MaxLengthValidationError(3)])).toBe("[validators.max-length]");
  });

  it("should translate a password match error", () => {
    const error: ValidationError = { kind: "match" };

    expect(firstErrorMessage(translate, [error])).toBe("[user.password-must-match]");
  });

  it("should fall back to the validator message for unmapped errors", () => {
    const error: ValidationError = { kind: "custom", message: "A custom error" };

    expect(firstErrorMessage(translate, [error])).toBe("A custom error");
  });

  it("should return null for unmapped errors without a message", () => {
    const error: ValidationError = { kind: "custom" };

    expect(firstErrorMessage(translate, [error])).toBeNull();
  });
});

describe("whitespace", () => {
  let injector: Injector;

  beforeEach(async () => {
    injector = await createTestInjector();
  });

  it("should accept values without whitespace and reject values with whitespace", () => {
    const model = signal({ value: "hello" });
    const testForm = form(
      model,
      (schemaPath) => {
        whitespace(schemaPath.value);
      },
      { injector },
    );

    expect(testForm.value().errors()).toHaveLength(0);

    model.set({ value: "hello world" });
    expect(testForm.value().errors()).toHaveLength(1);
  });
});

describe("url", () => {
  let injector: Injector;

  function urlErrors(value: string) {
    const model = signal({ value });
    const testForm = form(
      model,
      (schemaPath) => {
        url(schemaPath.value);
      },
      { injector },
    );
    return testForm.value().errors();
  }

  beforeEach(async () => {
    injector = await createTestInjector();
  });

  it("should accept http and https urls", () => {
    expect(urlErrors("https://mealie.io")).toHaveLength(0);
    expect(urlErrors("http://mealie.io")).toHaveLength(0);
  });

  it("should reject other protocols and invalid values", () => {
    expect(urlErrors("ftp://mealie.io")).toHaveLength(1);
    expect(urlErrors("not a url")).toHaveLength(1);
  });

  it("should reject empty values", () => {
    expect(urlErrors("")).toHaveLength(1);
  });
});

describe("urlOptional", () => {
  let injector: Injector;

  function urlOptionalErrors(value: string) {
    const model = signal({ value });
    const testForm = form(
      model,
      (schemaPath) => {
        urlOptional(schemaPath.value);
      },
      { injector },
    );
    return testForm.value().errors();
  }

  beforeEach(async () => {
    injector = await createTestInjector();
  });

  it("should accept empty values", () => {
    expect(urlOptionalErrors("")).toHaveLength(0);
  });

  it("should accept valid urls and reject invalid values", () => {
    expect(urlOptionalErrors("https://mealie.io")).toHaveLength(0);
    expect(urlOptionalErrors("not a url")).toHaveLength(1);
  });
});
