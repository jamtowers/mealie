import { TestBed } from "@angular/core/testing";
import {
  ActivatedRouteSnapshot,
  type Params,
  RedirectCommand,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from "@angular/router";

import type { Mock } from "vitest";

import {
  adminGuard,
  advancedOnlyGuard,
  authGuard,
  groupOnlyGuard,
  householdGuard,
  manageGuard,
  organizeGuard,
} from "./auth.guard";
import { AuthService } from "./auth.service";

interface MockUser {
  admin?: boolean;
  canManage?: boolean;
  canManageHousehold?: boolean;
  canOrganize?: boolean;
  groupSlug?: string;
  advanced?: boolean;
}

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

describe("authGuard", () => {
  let status$: Mock<() => "loading" | "authenticated" | "unauthenticated">;
  let parseUrl: Mock<(url: string) => UrlTree>;
  let consoleWarnSpy: Mock<typeof console.warn>;

  beforeEach(() => {
    status$ = vi.fn(() => "loading");
    parseUrl = vi.fn(() => ({}) as unknown as UrlTree);
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { status$, user$: vi.fn() },
        },
        { provide: Router, useValue: { parseUrl } },
      ],
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("should allow navigation when authenticated", () => {
    status$.mockReturnValue("authenticated");
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should redirect to /login when unauthenticated", () => {
    status$.mockReturnValue("unauthenticated");
    parseUrl.mockReturnValue({} as UrlTree);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(RedirectCommand);
  });

  it("should block navigation when loading", () => {
    status$.mockReturnValue("loading");
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith("Tried navigating while auth state is getting resolved, ignoring.");
  });
});

describe("adminGuard", () => {
  let user$: Mock<() => MockUser | null>;

  beforeEach(() => {
    user$ = vi.fn(() => null);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { status$: vi.fn(), user$ } }],
    });
  });

  it("should allow navigation for admin users", () => {
    user$.mockReturnValue({ admin: true });
    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should block navigation for non-admin users", () => {
    user$.mockReturnValue({ admin: false });
    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(false);
  });

  it("should block navigation when user is null", () => {
    user$.mockReturnValue(null);
    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(false);
  });
});

describe("manageGuard", () => {
  let user$: Mock<() => MockUser | null>;
  let parseUrl: Mock<(url: string) => UrlTree>;
  let consoleWarnSpy: Mock<typeof console.warn>;

  beforeEach(() => {
    user$ = vi.fn(() => null);
    parseUrl = vi.fn(() => ({}) as unknown as UrlTree);
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { status$: vi.fn(), user$ } },
        { provide: Router, useValue: { parseUrl } },
      ],
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("should allow navigation when user has canManage", () => {
    user$.mockReturnValue({ canManage: true });
    const result = TestBed.runInInjectionContext(() => manageGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should block navigation when user lacks canManage", () => {
    user$.mockReturnValue({ canManage: false });
    const result = TestBed.runInInjectionContext(() => manageGuard(mockRoute, mockState));
    expect(result).toBe(false);
  });

  it("should block navigation when user is null", () => {
    user$.mockReturnValue(null);
    const result = TestBed.runInInjectionContext(() => manageGuard(mockRoute, mockState));
    expect(result).toBe(false);
  });
});

describe("householdGuard", () => {
  let user$: Mock<() => MockUser | null>;
  let consoleWarnSpy: Mock<typeof console.warn>;

  beforeEach(() => {
    user$ = vi.fn(() => null);
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { status$: vi.fn(), user$ } }],
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("should allow navigation when user has canManageHousehold", () => {
    user$.mockReturnValue({ canManageHousehold: true });
    const result = TestBed.runInInjectionContext(() => householdGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should block navigation when user lacks canManageHousehold", () => {
    user$.mockReturnValue({ canManageHousehold: false });
    const result = TestBed.runInInjectionContext(() => householdGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith("User is not allowed to manage household");
  });

  it("should block navigation when user is null", () => {
    user$.mockReturnValue(null);
    const result = TestBed.runInInjectionContext(() => householdGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith("User is not allowed to manage household");
  });
});

describe("organizeGuard", () => {
  let user$: Mock<() => MockUser | null>;
  let consoleWarnSpy: Mock<typeof console.warn>;

  beforeEach(() => {
    user$ = vi.fn(() => null);
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { status$: vi.fn(), user$ } }],
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("should allow navigation when user has canOrganize", () => {
    user$.mockReturnValue({ canOrganize: true });
    const result = TestBed.runInInjectionContext(() => organizeGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should block navigation when user lacks canOrganize", () => {
    user$.mockReturnValue({ canOrganize: false });
    const result = TestBed.runInInjectionContext(() => organizeGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith("User is not allowed to organize data");
  });

  it("should block navigation when user is null", () => {
    user$.mockReturnValue(null);
    const result = TestBed.runInInjectionContext(() => organizeGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith("User is not allowed to organize data");
  });
});

describe("groupOnlyGuard", () => {
  let user$: Mock<() => MockUser | null>;

  beforeEach(() => {
    user$ = vi.fn(() => null);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { status$: vi.fn(), user$ } }],
    });
  });

  const createRoute = (groupSlug: string): ActivatedRouteSnapshot =>
    ({ params: { groupSlug } as Params }) as unknown as ActivatedRouteSnapshot;

  it("should allow navigation when route groupSlug matches user's group", () => {
    user$.mockReturnValue({ groupSlug: "my-group" });
    const result = TestBed.runInInjectionContext(() => groupOnlyGuard(createRoute("my-group"), mockState));
    expect(result).toBe(true);
  });

  it("should block navigation when route groupSlug does not match user's group", () => {
    user$.mockReturnValue({ groupSlug: "my-group" });
    const result = TestBed.runInInjectionContext(() => groupOnlyGuard(createRoute("other-group"), mockState));
    expect(result).toBe(false);
  });

  it("should block navigation when user is null", () => {
    user$.mockReturnValue(null);
    const result = TestBed.runInInjectionContext(() => groupOnlyGuard(createRoute("my-group"), mockState));
    expect(result).toBe(false);
  });
});

describe("advancedOnlyGuard", () => {
  let user$: Mock<() => MockUser | null>;
  let consoleWarnSpy: Mock<typeof console.warn>;

  beforeEach(() => {
    user$ = vi.fn(() => null);
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { status$: vi.fn(), user$ } }],
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("should allow navigation when user has advanced access", () => {
    user$.mockReturnValue({ advanced: true });
    const result = TestBed.runInInjectionContext(() => advancedOnlyGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should block navigation when user lacks advanced access", () => {
    user$.mockReturnValue({ advanced: false });
    const result = TestBed.runInInjectionContext(() => advancedOnlyGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith("User is not allowed to access advanced features");
  });

  it("should block navigation when user is null", () => {
    user$.mockReturnValue(null);
    const result = TestBed.runInInjectionContext(() => advancedOnlyGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith("User is not allowed to access advanced features");
  });
});
