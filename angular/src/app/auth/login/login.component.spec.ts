import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";
import { Router } from "@angular/router";

import { MatButtonHarness } from "@angular/material/button/testing";
import { MatCheckboxHarness } from "@angular/material/checkbox/testing";
import { MatIconRegistry } from "@angular/material/icon";
import { MatInputHarness } from "@angular/material/input/testing";
import { MatSnackBar } from "@angular/material/snack-bar";

import { TranslateService, provideTranslateService } from "@ngx-translate/core";
import { firstValueFrom, of } from "rxjs";

import { UsersAuthenticationService } from "@api/services/usersAuthentication.service";
import { UsersCRUDService } from "@api/services/usersCRUD.service";
import { mockDomSanitizer } from "@testing/dom-sanitizer.mock";
import { mockSvgIcons } from "@testing/mock-icons.mock";
import { SnackbarProvider } from "@theme/snackbar.provider";

import { AuthService } from "../auth.service";
// Import the component default export
import LoginComponent from "./login.component";

const SVG_ICONS = ["silverware-variant", "email", "lock", "eye-off", "eye", "heart", "github", "folder-outline"];

// ── Mock services ──

class MockAuthService {
  signIn = vi.fn().mockResolvedValue(undefined as void);
}

class MockRouter {
  navigate = vi.fn().mockResolvedValue(true);
  navigateByUrl = vi.fn().mockResolvedValue(true);
}

class MockMatSnackBar {
  open = vi.fn();
}

// ── API service mocks ──

const mockAuthApi = {
  getTokenApiAuthTokenPost: vi.fn().mockReturnValue(of({ access_token: "test-token" })),
};

const mockUsersApi = {
  getLoggedInUserApiUsersSelfGet: vi
    .fn()
    .mockReturnValue(
      of({} as unknown as Parameters<UsersCRUDService["getLoggedInUserApiUsersSelfGet"]> extends [] ? void : never),
    ),
};

// ── Helpers ──

async function createComponent(
  overrides: {
    authService?: Partial<AuthService>;
    router?: Partial<Router>;
    snackBar?: Partial<MatSnackBar>;
  } = {},
): Promise<ComponentFixture<LoginComponent>> {
  await TestBed.configureTestingModule({
    imports: [],
    providers: [
      { provide: AuthService, useValue: overrides.authService ?? new MockAuthService() },
      { provide: Router, useValue: overrides.router ?? new MockRouter() },
      { provide: MatSnackBar, useValue: overrides.snackBar ?? new MockMatSnackBar() },
      provideTranslateService({ fallbackLang: "en-US" }),
      { provide: DomSanitizer, useValue: mockDomSanitizer },
      { provide: UsersAuthenticationService, useValue: mockAuthApi },
      { provide: UsersCRUDService, useValue: mockUsersApi },
      SnackbarProvider,
    ],
  }).compileComponents();

  // Seed translations so TranslatePipe doesn't throw
  const translate = TestBed.inject(TranslateService);
  translate.setTranslation("en-US", {
    "user.sign-in": "Sign In",
    "user.email-or-username": "Email or Username",
    "user.password": "Password",
    "user.remember-me": "Remember Me",
    "user.login": "Login",
    "user.hide-password": "Hide Password",
    "general.loading": "Loading",
  });
  await firstValueFrom(translate.use("en-US"));

  // Register mock SVG icons so MatIcon doesn't error
  mockSvgIcons(TestBed.inject(MatIconRegistry), SVG_ICONS);

  const fixture = TestBed.createComponent(LoginComponent);
  await fixture.whenStable();

  return fixture;
}

/** Fill form fields via harnesses — uses harness setValue which dispatches events internally. */
async function fillForm(loader: HarnessLoader, fixture: ComponentFixture<LoginComponent>) {
  const [usernameHarness, passwordHarness] = await loader.getAllHarnesses(MatInputHarness);
  await usernameHarness.setValue("user");
  await passwordHarness.setValue("pass");

  await fixture.whenStable();
}

// ── Tests ──

describe("LoginComponent", () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let loader: HarnessLoader;
  let authService: MockAuthService;
  let router: MockRouter;
  let snackBar: MockMatSnackBar;

  beforeEach(async () => {
    fixture = await createComponent();
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    router = TestBed.inject(Router) as unknown as MockRouter;
    snackBar = TestBed.inject(MatSnackBar) as unknown as MockMatSnackBar;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render form fields", async () => {
    await expect(loader.getAllHarnesses(MatInputHarness)).resolves.toHaveLength(2);
    await expect(loader.getAllHarnesses(MatCheckboxHarness)).resolves.toHaveLength(1);
  });

  it("should render a submit button", async () => {
    const submitButton = await loader.getHarness(MatButtonHarness.with({ selector: 'button[type="submit"]' }));
    expect(submitButton).toBeTruthy();
  });

  it("should have footer links", async () => {
    const links = fixture.nativeElement.querySelectorAll("a[href]");
    expect(links).toHaveLength(3);

    const expectedLinks = [
      { href: "https://github.com/sponsors/hay-kot", text: "Sponsor" },
      { href: "https://github.com/mealie-recipes/mealie", text: "GitHub" },
      { href: "https://docs.mealie.io/", text: "Docs" },
    ];

    for (const [index, expected] of expectedLinks.entries()) {
      expect(links[index].getAttribute("href")).toBe(expected.href);
      expect(links[index].getAttribute("target")).toBe("_blank");
    }
  });

  it("should toggle password visibility", async () => {
    const inputEl = fixture.nativeElement.querySelector("mat-form-field:nth-of-type(2) input") as HTMLInputElement;
    expect(inputEl.type).toBe("password");

    // Click the toggle button
    const toggleBtn = fixture.nativeElement.querySelector("mat-form-field button[maticonbutton]");
    await toggleBtn.click();
    await fixture.whenStable();

    expect(inputEl.type).toBe("text");

    // Click again to toggle back
    await toggleBtn.click();
    await fixture.whenStable();

    expect(inputEl.type).toBe("password");
  });

  it("should navigate to root on successful login from /login", async () => {
    vi.spyOn(window, "location", "get").mockReturnValue({
      href: "http://localhost/login",
    } as Location);

    await fillForm(loader, fixture);

    const submitButton = await loader.getHarness(MatButtonHarness.with({ selector: 'button[type="submit"]' }));
    await submitButton.click();
    await fixture.whenStable();

    expect(authService.signIn).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(["/"]);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it("should navigate to original path on successful login from non-login route", async () => {
    vi.spyOn(window, "location", "get").mockReturnValue({
      href: "http://localhost/recipes",
    } as Location);

    await fillForm(loader, fixture);

    const submitButton = await loader.getHarness(MatButtonHarness.with({ selector: 'button[type="submit"]' }));
    await submitButton.click();
    await fixture.whenStable();

    expect(authService.signIn).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith("/recipes", {
      skipLocationChange: true,
    });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("should show error snackbar on failed login", async () => {
    authService.signIn.mockRejectedValueOnce(new Error("Invalid credentials"));

    await fillForm(loader, fixture);

    const submitButton = await loader.getHarness(MatButtonHarness.with({ selector: 'button[type="submit"]' }));
    await submitButton.click();
    await fixture.whenStable();

    expect(snackBar.open).toHaveBeenCalledWith("Invalid Credentials", "Close", {
      panelClass: "error",
    });
  });

  it("should display translate pipe outputs in template", async () => {
    const title = fixture.nativeElement.querySelector("h2");
    expect(title.textContent).toContain("Sign In");
  });

  it("should have aria attributes on password toggle button", async () => {
    const toggleBtn = fixture.nativeElement.querySelector("mat-form-field button[maticonbutton]");
    expect(toggleBtn.getAttribute("aria-pressed")).toBe("true");
    expect(toggleBtn.getAttribute("aria-label")).toBe("Hide Password");
  });
});
