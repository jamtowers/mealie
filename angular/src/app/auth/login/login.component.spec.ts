import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";

import { MatButtonHarness } from "@angular/material/button/testing";
import { MatCheckboxHarness } from "@angular/material/checkbox/testing";
import { MatIconRegistry } from "@angular/material/icon";
import { MatInputHarness } from "@angular/material/input/testing";
import { MatSnackBar } from "@angular/material/snack-bar";

import { TranslateService } from "@ngx-translate/core";
import type { Mock } from "vitest";

import type { AppInfo } from "@api/models/app-info";
import { mockAppInfo } from "@testing/app-info.mock";
import { mockLocalStorage } from "@testing/local-storage.mock";
import { MockMatSnackBar } from "@testing/mat-snack-bar.mock";
import { MockMatIconRegistry } from "@testing/mock-icons.mock";
import { mockTranslateService } from "@testing/translate-service.mock";
import { AppInfoService } from "@utils/app-info.service";

import { AuthService } from "../auth.service";
// Import the component default export
import LoginComponent from "./login.component";

// ── Mock services ──

class MockAuthService {
  signIn = vi.fn().mockResolvedValue(undefined as void);
  startOidcFlow = vi.fn();
}

class MockAppInfoService {
  info$: Mock<() => AppInfo | null> = vi.fn(() => null);
  // Mirror the real service: derived lazily from the settled signals with safe defaults
  allowPasswordLogin$ = vi.fn(() => this.info$()?.allowPasswordLogin ?? true);
  enableOidc$ = vi.fn(() => this.info$()?.enableOidc ?? false);
  oidcProviderName$ = vi.fn(() => this.info$()?.oidcProviderName ?? "");
  allowSignup$ = vi.fn(() => this.info$()?.allowSignup ?? false);
  isFirstLogin$ = vi.fn(() => false);
}

// ── Helpers ──

async function createComponent(
  overrides: {
    authService?: MockAuthService;
    snackBar?: Partial<MatSnackBar>;
    appInfo?: MockAppInfoService;
  } = {},
): Promise<ComponentFixture<LoginComponent>> {
  // The auth shell renders the theme toggle, whose root service reads localStorage
  mockLocalStorage();

  await TestBed.configureTestingModule({
    imports: [],
    providers: [
      // Real router infrastructure (Router, ActivatedRoute, RouterLink dependencies)
      provideRouter([]),
      { provide: AuthService, useValue: overrides.authService ?? new MockAuthService() },
      { provide: MatSnackBar, useValue: overrides.snackBar ?? new MockMatSnackBar() },
      { provide: AppInfoService, useValue: overrides.appInfo ?? new MockAppInfoService() },
      { provide: TranslateService, useValue: mockTranslateService },
      { provide: MatIconRegistry, useValue: new MockMatIconRegistry() },
    ],
  }).compileComponents();

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
  let router: Router;
  let snackBar: MockMatSnackBar;

  beforeEach(async () => {
    fixture = await createComponent();
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    // Stub the navigation methods on the real router so tests assert without navigating
    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true);
    vi.spyOn(router, "navigateByUrl").mockResolvedValue(true);
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
    const links = fixture.nativeElement.querySelectorAll("footer a[href]");
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
    const inputEl = fixture.nativeElement.querySelector("mealie-hidden-input input") as HTMLInputElement;
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

  it("should show required errors when submitting an empty form", async () => {
    // jsdom does not run the form submit algorithm for button clicks, so dispatch it directly
    const form = fixture.nativeElement.querySelector("form") as HTMLFormElement;
    form.dispatchEvent(new Event("submit"));
    await fixture.whenStable();

    expect(authService.signIn).not.toHaveBeenCalled();

    const errors = Array.from(fixture.nativeElement.querySelectorAll("mat-error")) as HTMLElement[];
    expect(errors.map((el) => el.textContent)).toEqual(["[validators.required]", "[validators.required]"]);
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
    expect(title.textContent).toContain("[user.sign-in]");
  });

  it("should have aria attributes on password toggle button", async () => {
    const toggleBtn = fixture.nativeElement.querySelector("mat-form-field button[maticonbutton]");
    expect(toggleBtn.getAttribute("aria-pressed")).toBe("true");
    expect(toggleBtn.getAttribute("aria-label")).toBe("[user.hide-password]");
  });

  it("should not show first-login banner when isFirstLogin is false", async () => {
    const banner = fixture.nativeElement.querySelector("#banner-card");
    expect(banner).toBeNull();
  });

  it("should NOT pre-fill form when isFirstLogin is false", async () => {
    const [usernameHarness, passwordHarness] = await loader.getAllHarnesses(MatInputHarness);

    expect(await usernameHarness.getValue()).toBe("");
    expect(await passwordHarness.getValue()).toBe("");
  });

  it("should not render an oidc button by default", () => {
    expect(fixture.nativeElement.querySelector('button[matButton="filled"][type="button"]')).toBeNull();
  });
});

describe("LoginComponent isFirstLogin", () => {
  let firstLoginFixture: ComponentFixture<LoginComponent>;
  let firstLoginLoader: HarnessLoader;

  beforeEach(async () => {
    const appInfo = new MockAppInfoService();
    appInfo.isFirstLogin$ = vi.fn(() => true);
    firstLoginFixture = await createComponent({ appInfo });
    await firstLoginFixture.whenStable();
    firstLoginLoader = TestbedHarnessEnvironment.loader(firstLoginFixture);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should show first-login banner when isFirstLogin is true", async () => {
    const banner = firstLoginFixture.nativeElement.querySelector("#banner-card");
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain("changeme@example.com");
    expect(banner.textContent).toContain("MyPassword");
  });

  it("should pre-fill form with default credentials when isFirstLogin is true", async () => {
    const [usernameHarness, passwordHarness] = await firstLoginLoader.getAllHarnesses(MatInputHarness);

    expect(await usernameHarness.getValue()).toBe("changeme@example.com");
    expect(await passwordHarness.getValue()).toBe("MyPassword");
  });
});

describe("LoginComponent OIDC", () => {
  let fixture: ComponentFixture<LoginComponent>;
  let loader: HarnessLoader;
  let authService: MockAuthService;

  beforeEach(async () => {
    const appInfo = new MockAppInfoService();
    appInfo.info$ = vi.fn<() => AppInfo | null>(() =>
      mockAppInfo({ enableOidc: true, oidcProviderName: "My Provider" }),
    );
    fixture = await createComponent({ appInfo });
    loader = TestbedHarnessEnvironment.loader(fixture);
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the oidc button with the provider name", () => {
    const button = fixture.nativeElement.querySelector(
      'button[matButton="filled"][type="button"]',
    ) as HTMLButtonElement;
    expect(button.textContent).toContain("[user.login-oidc]");
    expect(button.textContent).toContain("My Provider");
  });

  it("should render the or divider between the password form and the oidc button", () => {
    expect(fixture.nativeElement.querySelector("#or-divider")).not.toBeNull();
  });

  it("should start the oidc flow when the oidc button is clicked", async () => {
    const oidcButton = await loader.getHarness(
      MatButtonHarness.with({ selector: 'button[matButton="filled"][type="button"]' }),
    );
    await oidcButton.click();

    expect(authService.startOidcFlow).toHaveBeenCalledOnce();
  });
});

describe("LoginComponent app info", () => {
  it("should show the register and forgot-password links when signup is allowed", async () => {
    const appInfo = new MockAppInfoService();
    appInfo.info$ = vi.fn<() => AppInfo | null>(() => mockAppInfo({ allowSignup: true }));
    const fixture = await createComponent({ appInfo });

    const registerLink = fixture.nativeElement.querySelector('a[href="/register"]') as HTMLAnchorElement;
    expect(registerLink).not.toBeNull();
    expect(registerLink.textContent).toBe("[user.register]");
    expect(fixture.nativeElement.querySelector('a[href="/forgot-password"]')).not.toBeNull();
  });

  it("should hide the register link when signup is disabled", async () => {
    const appInfo = new MockAppInfoService();
    appInfo.info$ = vi.fn<() => AppInfo | null>(() => mockAppInfo({ allowSignup: false }));
    const fixture = await createComponent({ appInfo });

    expect(fixture.nativeElement.querySelector('a[href="/register"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/forgot-password"]')).not.toBeNull();
  });

  it("should hide the password form when password login is disabled", async () => {
    const appInfo = new MockAppInfoService();
    appInfo.info$ = vi.fn<() => AppInfo | null>(() => mockAppInfo({ allowPasswordLogin: false, enableOidc: false }));
    const fixture = await createComponent({ appInfo });
    const loader = TestbedHarnessEnvironment.loader(fixture);

    expect(await loader.getAllHarnesses(MatInputHarness)).toHaveLength(0);
    expect(await loader.getAllHarnesses(MatCheckboxHarness)).toHaveLength(0);
  });

  it("should show only the oidc button when password login is disabled but oidc is enabled", async () => {
    const appInfo = new MockAppInfoService();
    appInfo.info$ = vi.fn<() => AppInfo | null>(() => mockAppInfo({ allowPasswordLogin: false, enableOidc: true }));
    const fixture = await createComponent({ appInfo });
    const loader = TestbedHarnessEnvironment.loader(fixture);

    expect(await loader.getAllHarnesses(MatInputHarness)).toHaveLength(0);
    expect(fixture.nativeElement.querySelector("#or-divider")).toBeNull();
    const oidcButton = await loader.getHarness(
      MatButtonHarness.with({ selector: 'button[matButton="filled"][type="button"]' }),
    );
    expect(oidcButton).toBeTruthy();
  });
});
