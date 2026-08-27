import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";
import { Router, provideRouter } from "@angular/router";

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

import ForgotPasswordComponent from "./forgot-password.component";

const SVG_ICONS = ["email", "arrow-left", "translate", "theme-light-dark"];

const mockUsersPasswordsApi = {
  forgotPasswordApiUsersForgotPasswordPost: vi.fn(),
};

class MockMatSnackBar {
  open = vi.fn();
}

async function createComponent(): Promise<ComponentFixture<ForgotPasswordComponent>> {
  // The auth shell renders the theme toggle, whose root service reads localStorage
  mockLocalStorage();

  mockUsersPasswordsApi.forgotPasswordApiUsersForgotPasswordPost.mockReset().mockReturnValue(of({ status: 200 }));

  await TestBed.configureTestingModule({
    imports: [],
    providers: [
      provideRouter([]),
      { provide: UsersPasswordsService, useValue: mockUsersPasswordsApi },
      { provide: MatSnackBar, useValue: new MockMatSnackBar() },
      provideTranslateService({ fallbackLang: "en-US" }),
      { provide: DomSanitizer, useValue: mockDomSanitizer },
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation("en-US", {
    "user.forgot-password": "Forgot Password",
    "user.email": "Email",
    "user.reset-password": "Reset Password",
    "user.forgot-password-text": "We will send you an email to reset your password",
    "profile.email-sent": "Email Sent",
    "profile.error-sending-email": "Error Sending Email",
    "general.loading": "Loading",
    "general.back": "Back",
    "sidebar.language": "Language",
    "settings.theme.auto-mode": "Auto Mode",
    "validators.required": "This Field is Required",
    "validators.invalid-email": "Email Must Be Valid",
  });
  await firstValueFrom(translate.use("en-US"));

  mockSvgIcons(TestBed.inject(MatIconRegistry), SVG_ICONS);

  const fixture = TestBed.createComponent(ForgotPasswordComponent);
  await fixture.whenStable();

  return fixture;
}

describe("ForgotPasswordComponent", () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let loader: HarnessLoader;
  let router: Router;
  let snackBar: MockMatSnackBar;

  beforeEach(async () => {
    fixture = await createComponent();
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

  const setEmail = async (value: string) => {
    const [emailHarness] = await loader.getAllHarnesses(MatInputHarness);
    await emailHarness.setValue(value);
  };

  it("should create", () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("should render the email field and a submit button", async () => {
    expect(await loader.getAllHarnesses(MatInputHarness)).toHaveLength(1);
    const submitButton = await loader.getHarness(MatButtonHarness.with({ selector: 'button[type="submit"]' }));
    expect(submitButton).toBeTruthy();
  });

  it("should show the required error without calling the API when submitting empty", async () => {
    await submitForm();

    expect(mockUsersPasswordsApi.forgotPasswordApiUsersForgotPasswordPost).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector("mat-error")?.textContent).toBe("This Field is Required");
  });

  it("should show the email error without calling the API for an invalid email", async () => {
    await setEmail("not-an-email");
    await submitForm();

    expect(mockUsersPasswordsApi.forgotPasswordApiUsersForgotPasswordPost).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector("mat-error")?.textContent).toBe("Email Must Be Valid");
  });

  it("should send the email and navigate to login on success", async () => {
    await setEmail("user@example.com");
    await submitForm();

    expect(mockUsersPasswordsApi.forgotPasswordApiUsersForgotPasswordPost).toHaveBeenCalledWith(
      { email: "user@example.com" },
      "response",
    );
    expect(snackBar.open).toHaveBeenCalledWith("Email Sent", "Close");
    expect(router.navigate).toHaveBeenCalledWith(["/login"]);
  });

  it("should show the error snackbar when the API responds with a non-200 status", async () => {
    mockUsersPasswordsApi.forgotPasswordApiUsersForgotPasswordPost.mockReturnValue(of({ status: 500 }));

    await setEmail("user@example.com");
    await submitForm();

    expect(snackBar.open).toHaveBeenCalledWith("Error Sending Email", "Close", { panelClass: "error" });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("should show the error snackbar when the API throws", async () => {
    mockUsersPasswordsApi.forgotPasswordApiUsersForgotPasswordPost.mockImplementation(() => {
      throw new Error("boom");
    });

    await setEmail("user@example.com");
    await submitForm();

    expect(snackBar.open).toHaveBeenCalledWith("Error Sending Email", "Close", { panelClass: "error" });
  });
});
