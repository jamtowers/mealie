import { TestBed } from "@angular/core/testing";
import { RedirectCommand, Router, UrlTree } from "@angular/router";

import type { Mock } from "vitest";

import type { UserOut } from "@api/models/user-out";
import { mockActivatedRoute, mockParseUrl, mockRouterState } from "@testing/route.mock";
import { createMockUser } from "@testing/user.mock";

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

const mockRoute = mockActivatedRoute();
const mockState = mockRouterState();

describe("authGuard", () => {
  let status$: Mock<() => "loading" | "authenticated" | "unauthenticated">;
  let parseUrl: Mock<(url: string) => UrlTree>;

  beforeEach(() => {
    status$ = vi.fn(() => "loading");
    parseUrl = mockParseUrl();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

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
    vi.restoreAllMocks();
  });

  it("should allow navigation when authenticated", () => {
    status$.mockReturnValue("authenticated");
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should redirect to /login when unauthenticated", () => {
    status$.mockReturnValue("unauthenticated");
    const loginUrl = {} as UrlTree;
    parseUrl.mockReturnValue(loginUrl);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(RedirectCommand);
    const command = result as RedirectCommand;
    expect(command.redirectTo).toBe(loginUrl);
    expect(command.navigationBehaviorOptions).toEqual({ skipLocationChange: true });
    expect(parseUrl).toHaveBeenCalledWith("/login");
  });

  it("should block navigation when loading", () => {
    status$.mockReturnValue("loading");
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith("Tried navigating while auth state is getting resolved, ignoring.");
  });
});

describe("adminGuard", () => {
  let user$: Mock<() => UserOut | null>;

  beforeEach(() => {
    user$ = vi.fn(() => null);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { status$: vi.fn(), user$ } }],
    });
  });

  it("should allow navigation for admin users", () => {
    user$.mockReturnValue(createMockUser({ admin: true }));
    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should block navigation for non-admin users", () => {
    user$.mockReturnValue(createMockUser({ admin: false }));
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
  let user$: Mock<() => UserOut | null>;
  let parseUrl: Mock<(url: string) => UrlTree>;

  beforeEach(() => {
    user$ = vi.fn(() => null);
    parseUrl = mockParseUrl();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { status$: vi.fn(), user$ } },
        { provide: Router, useValue: { parseUrl } },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should allow navigation when user has canManage", () => {
    user$.mockReturnValue(createMockUser({ canManage: true }));
    const result = TestBed.runInInjectionContext(() => manageGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should block navigation when user lacks canManage", () => {
    user$.mockReturnValue(createMockUser({ canManage: false }));
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
  let user$: Mock<() => UserOut | null>;

  beforeEach(() => {
    user$ = vi.fn(() => null);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { status$: vi.fn(), user$ } }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should allow navigation when user has canManageHousehold", () => {
    user$.mockReturnValue(createMockUser({ canManageHousehold: true }));
    const result = TestBed.runInInjectionContext(() => householdGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should block navigation when user lacks canManageHousehold", () => {
    user$.mockReturnValue(createMockUser({ canManageHousehold: false }));
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
  let user$: Mock<() => UserOut | null>;

  beforeEach(() => {
    user$ = vi.fn(() => null);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { status$: vi.fn(), user$ } }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should allow navigation when user has canOrganize", () => {
    user$.mockReturnValue(createMockUser({ canOrganize: true }));
    const result = TestBed.runInInjectionContext(() => organizeGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should block navigation when user lacks canOrganize", () => {
    user$.mockReturnValue(createMockUser({ canOrganize: false }));
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
  let user$: Mock<() => UserOut | null>;

  beforeEach(() => {
    user$ = vi.fn(() => null);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { status$: vi.fn(), user$ } }],
    });
  });

  it("should allow navigation when route groupSlug matches user's group", () => {
    user$.mockReturnValue(createMockUser({ groupSlug: "my-group" }));
    const result = TestBed.runInInjectionContext(() =>
      groupOnlyGuard(mockActivatedRoute({ params: { groupSlug: "my-group" } }), mockState),
    );
    expect(result).toBe(true);
  });

  it("should block navigation when route groupSlug does not match user's group", () => {
    user$.mockReturnValue(createMockUser({ groupSlug: "my-group" }));
    const result = TestBed.runInInjectionContext(() =>
      groupOnlyGuard(mockActivatedRoute({ params: { groupSlug: "other-group" } }), mockState),
    );
    expect(result).toBe(false);
  });

  it("should block navigation when user is null", () => {
    user$.mockReturnValue(null);
    const result = TestBed.runInInjectionContext(() =>
      groupOnlyGuard(mockActivatedRoute({ params: { groupSlug: "my-group" } }), mockState),
    );
    expect(result).toBe(false);
  });
});

describe("advancedOnlyGuard", () => {
  let user$: Mock<() => UserOut | null>;

  beforeEach(() => {
    user$ = vi.fn(() => null);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { status$: vi.fn(), user$ } }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should allow navigation when user has advanced access", () => {
    user$.mockReturnValue(createMockUser({ advanced: true }));
    const result = TestBed.runInInjectionContext(() => advancedOnlyGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should block navigation when user lacks advanced access", () => {
    user$.mockReturnValue(createMockUser({ advanced: false }));
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
