import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";

import { MatButtonHarness } from "@angular/material/button/testing";
import { MatIconRegistry } from "@angular/material/icon";
import { MatInputHarness } from "@angular/material/input/testing";
import { MatSnackBar } from "@angular/material/snack-bar";

import { TranslateService } from "@ngx-translate/core";
import { of } from "rxjs";

import { UsersPasswordsService } from "@api/services/usersPasswords.service";
import { mockLocalStorage } from "@testing/local-storage.mock";
import { MockMatSnackBar } from "@testing/mat-snack-bar.mock";
import { MockMatIconRegistry } from "@testing/mock-icons.mock";
import { mockTranslateService } from "@testing/translate-service.mock";

import ForgotPasswordComponent from "./forgot-password.component";

const mockUsersPasswordsApi = {
  forgotPasswordApiUsersForgotPasswordPost: vi.fn(),
};

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
      { provide: TranslateService, useValue: mockTranslateService },
      { provide: MatIconRegistry, useValue: new MockMatIconRegistry() },
    ],
  }).compileComponents();

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
    expect(fixture.nativeElement.querySelector("mat-error")?.textContent).toBe("[validators.required]");
  });

  it("should show the email error without calling the API for an invalid email", async () => {
    await setEmail("not-an-email");
    await submitForm();

    expect(mockUsersPasswordsApi.forgotPasswordApiUsersForgotPasswordPost).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector("mat-error")?.textContent).toBe("[validators.invalid-email]");
  });

  it("should send the email and navigate to login on success", async () => {
    await setEmail("user@example.com");
    await submitForm();

    expect(mockUsersPasswordsApi.forgotPasswordApiUsersForgotPasswordPost).toHaveBeenCalledWith(
      { email: "user@example.com" },
      "response",
    );
    expect(snackBar.open).toHaveBeenCalledWith("[profile.email-sent]", "Close");
    expect(router.navigate).toHaveBeenCalledWith(["/login"]);
  });

  it("should show the error snackbar when the API responds with a non-200 status", async () => {
    mockUsersPasswordsApi.forgotPasswordApiUsersForgotPasswordPost.mockReturnValue(of({ status: 500 }));

    await setEmail("user@example.com");
    await submitForm();

    expect(snackBar.open).toHaveBeenCalledWith("[profile.error-sending-email]", "Close", { panelClass: "error" });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("should show the error snackbar when the API throws", async () => {
    mockUsersPasswordsApi.forgotPasswordApiUsersForgotPasswordPost.mockImplementation(() => {
      throw new Error("boom");
    });

    await setEmail("user@example.com");
    await submitForm();

    expect(snackBar.open).toHaveBeenCalledWith("[profile.error-sending-email]", "Close", { panelClass: "error" });
  });
});
