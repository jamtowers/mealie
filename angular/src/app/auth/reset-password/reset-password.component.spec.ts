import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute, Router, provideRouter } from "@angular/router";

import { MatButtonHarness } from "@angular/material/button/testing";
import { MatIconRegistry } from "@angular/material/icon";
import { MatInputHarness } from "@angular/material/input/testing";
import { MatSnackBar } from "@angular/material/snack-bar";

import { TranslateService, provideTranslateService } from "@ngx-translate/core";
import { firstValueFrom, of } from "rxjs";

import { UsersPasswordsService } from "@api/services/usersPasswords.service";
import { mockDomSanitizer } from "@testing/dom-sanitizer.mock";
import { mockLocalStorage } from "@testing/local-storage.mock";
import { mockSvgIcons } from "@testing/mock-icons.mock";

import ResetPasswordComponent from "./reset-password.component";

const SVG_ICONS = ["email", "lock", "eye", "eye-off", "arrow-left", "translate", "theme-light-dark"];

const mockUsersPasswordsApi = {
  resetPasswordApiUsersResetPasswordPost: vi.fn(),
};

const mockActivatedRoute = {
  snapshot: {
    queryParamMap: {
      get: vi.fn(),
    },
  },
};

class MockMatSnackBar {
  open = vi.fn();
}

async function createComponent(
  routeToken: string | null = "test-token",
): Promise<ComponentFixture<ResetPasswordComponent>> {
  // The auth shell renders the theme toggle, whose root service reads localStorage
  mockLocalStorage();

  mockActivatedRoute.snapshot.queryParamMap.get.mockReturnValue(routeToken);
  mockUsersPasswordsApi.resetPasswordApiUsersResetPasswordPost.mockReset().mockReturnValue(of({ status: 200 }));

  await TestBed.configureTestingModule({
    imports: [],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: mockActivatedRoute },
      { provide: UsersPasswordsService, useValue: mockUsersPasswordsApi },
      { provide: MatSnackBar, useValue: new MockMatSnackBar() },
      provideTranslateService({ fallbackLang: "en-US" }),
      { provide: DomSanitizer, useValue: mockDomSanitizer },
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation("en-US", {
    "user.reset-password": "Reset Password",
    "user.email": "Email",
    "user.please-enter-password": "Please enter your email and a new password",
    "user.password": "Password",
    "user.confirm-password": "Confirm Password",
    "user.hide-password": "Hide Password",
    "user.password-must-match": "Passwords must match",
    "user.password-updated": "Password Updated",
    "user.password-strength": "Password is {strength}",
    "user.password-strength-values.weak": "Weak",
    "user.password-strength-values.good": "Good",
    "user.password-strength-values.strong": "Strong",
    "user.password-strength-values.very-strong": "Very Strong",
    "events.something-went-wrong": "Something Went Wrong",
    "general.loading": "Loading",
    "general.back": "Back",
    "sidebar.language": "Language",
    "settings.theme.auto-mode": "Auto Mode",
    "validators.required": "This Field is Required",
    "validators.invalid-email": "Email Must Be Valid",
  });
  await firstValueFrom(translate.use("en-US"));

  mockSvgIcons(TestBed.inject(MatIconRegistry), SVG_ICONS);

  const fixture = TestBed.createComponent(ResetPasswordComponent);
  await fixture.whenStable();

  return fixture;
}

describe("ResetPasswordComponent", () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let loader: HarnessLoader;
  let router: Router;
  let snackBar: MockMatSnackBar;

  beforeEach(async () => {
    fixture = await createComponent();
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    // Stub the navigation methods on the real router so tests assert without navigating
    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true);
    snackBar = TestBed.inject(MatSnackBar) as unknown as MockMatSnackBar;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const submitForm = async () => {
    // jsdom does not run the form submit algorithm for button clicks, so dispatch it directly
    fixture.nativeElement.querySelector("form").dispatchEvent(new Event("submit"));
    await fixture.whenStable();
  };

  const fillForm = async (email: string, password: string, passwordConfirm: string) => {
    const [emailHarness, passwordHarness, confirmHarness] = await loader.getAllHarnesses(MatInputHarness);
    if (email) await emailHarness.setValue(email);
    if (password) await passwordHarness.setValue(password);
    if (passwordConfirm) await confirmHarness.setValue(passwordConfirm);
  };

  const errorTexts = () =>
    Array.from(fixture.nativeElement.querySelectorAll("mat-error") as NodeListOf<HTMLElement>).map(
      (el) => el.textContent,
    );

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should read the token from the query params", () => {
    expect(component["token"]()).toBe("test-token");
  });

  it("should render the email, password and confirm password inputs", async () => {
    expect(await loader.getAllHarnesses(MatInputHarness)).toHaveLength(3);
  });

  it("should enable the submit button when the token is present", async () => {
    const submitButton = await loader.getHarness(MatButtonHarness.with({ selector: 'button[type="submit"]' }));
    expect(await submitButton.isDisabled()).toBe(false);
  });

  it("should show required errors without calling the API when submitting empty", async () => {
    await submitForm();

    expect(mockUsersPasswordsApi.resetPasswordApiUsersResetPasswordPost).not.toHaveBeenCalled();
    expect(errorTexts()).toEqual(["This Field is Required", "This Field is Required", "This Field is Required"]);
  });

  it("should show the email error without calling the API for an invalid email", async () => {
    await fillForm("not-an-email", "abc123", "abc123");
    await submitForm();

    expect(mockUsersPasswordsApi.resetPasswordApiUsersResetPasswordPost).not.toHaveBeenCalled();
    expect(errorTexts()).toEqual(["Email Must Be Valid"]);
  });

  it("should show the match error without calling the API when the passwords do not match", async () => {
    await fillForm("user@example.com", "abc123", "nope987");
    await submitForm();

    expect(mockUsersPasswordsApi.resetPasswordApiUsersResetPasswordPost).not.toHaveBeenCalled();
    expect(errorTexts()).toEqual(["Passwords must match"]);
  });

  it("should reset the password and navigate to login on success", async () => {
    await fillForm("user@example.com", "abc123", "abc123");
    await submitForm();

    expect(mockUsersPasswordsApi.resetPasswordApiUsersResetPasswordPost).toHaveBeenCalledWith(
      { token: "test-token", email: "user@example.com", password: "abc123", passwordConfirm: "abc123" },
      "response",
    );
    expect(snackBar.open).toHaveBeenCalledWith("Password Updated", "Close");
    expect(router.navigate).toHaveBeenCalledWith(["/login"]);
  });

  it("should show the error snackbar when the API responds with a non-200 status", async () => {
    mockUsersPasswordsApi.resetPasswordApiUsersResetPasswordPost.mockReturnValue(of({ status: 500 }));

    await fillForm("user@example.com", "abc123", "abc123");
    await submitForm();

    expect(snackBar.open).toHaveBeenCalledWith("Something Went Wrong", "Close", { panelClass: "error" });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("should show the error snackbar when the API throws", async () => {
    mockUsersPasswordsApi.resetPasswordApiUsersResetPasswordPost.mockImplementation(() => {
      throw new Error("boom");
    });

    await fillForm("user@example.com", "abc123", "abc123");
    await submitForm();

    expect(snackBar.open).toHaveBeenCalledWith("Something Went Wrong", "Close", { panelClass: "error" });
  });
});

describe("ResetPasswordComponent without a token", () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    fixture = await createComponent(null);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should default the token to an empty string", () => {
    expect(fixture.componentInstance["token"]()).toBe("");
  });

  it("should disable the submit button", async () => {
    const submitButton = await loader.getHarness(MatButtonHarness.with({ selector: 'button[type="submit"]' }));
    expect(await submitButton.isDisabled()).toBe(true);
  });
});
