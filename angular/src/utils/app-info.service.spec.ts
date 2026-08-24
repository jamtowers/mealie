import { HttpClient, provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";

import { of, throwError } from "rxjs";

import type { AppInfo } from "@api/models/app-info";
import type { AppStartupInfo } from "@api/models/app-startup-info";
import { AppAboutService } from "@api/services/appAbout.service";

import { AppInfoService } from "./app-info.service";

function mockAppInfo(overrides: Partial<AppInfo> = {}): AppInfo {
  return {
    production: false,
    version: "1.0.0",
    demoStatus: false,
    allowSignup: true,
    allowPasswordLogin: true,
    enableOidc: false,
    oidcRedirect: false,
    oidcProviderName: "Test Provider",
    tokenTime: 3600,
    ...overrides,
  };
}

function mockStartupInfo(overrides: Partial<AppStartupInfo> = {}): AppStartupInfo {
  return {
    isFirstLogin: false,
    isDemo: false,
    ...overrides,
  };
}

describe("AppInfoService", () => {
  let appInfoService: AppInfoService;
  let getAppInfo: ReturnType<typeof vi.spyOn>;
  let getStartupInfo: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    getAppInfo = vi
      .spyOn(AppAboutService.prototype, "getAppInfoApiAppAboutGet")
      .mockReturnValue(of(mockAppInfo()) as never);
    getStartupInfo = vi
      .spyOn(AppAboutService.prototype, "getStartupInfoApiAppAboutStartupInfoGet")
      .mockReturnValue(of(mockStartupInfo()) as never);
    // HttpClient is only needed so the (mocked) api service can be instantiated
    vi.spyOn(HttpClient.prototype, "request").mockReturnValue(of({}) as never);

    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), AppInfoService],
    }).compileComponents();

    appInfoService = TestBed.inject(AppInfoService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should start with no info", () => {
    expect(appInfoService.info$()).toBeNull();
  });

  it("should fall back to safe defaults before info is loaded", () => {
    expect(appInfoService.allowPasswordLogin$()).toBe(true);
    expect(appInfoService.enableOidc$()).toBe(false);
    expect(appInfoService.oidcProviderName$()).toBe("");
    expect(appInfoService.startupInfo$()).toBeNull();
    expect(appInfoService.isFirstLogin$()).toBe(false);
  });

  it("should store the fetched app info", async () => {
    await appInfoService.initialize();

    expect(getAppInfo).toHaveBeenCalledOnce();
    expect(appInfoService.info$()).toEqual(mockAppInfo());
  });

  it("should only fetch once, even when initialize is called again", async () => {
    await appInfoService.initialize();
    await appInfoService.initialize();

    expect(getAppInfo).toHaveBeenCalledTimes(1);
    expect(getStartupInfo).toHaveBeenCalledTimes(1);
  });

  it("should swallow app info fetch failures and keep the info null", async () => {
    getAppInfo.mockReturnValue(throwError(() => new Error("network down")));

    await appInfoService.initialize();

    expect(appInfoService.info$()).toBeNull();
    // The startup info fetch is independent and still settles
    expect(appInfoService.startupInfo$()).toEqual(mockStartupInfo());
  });

  it("should expose the fetched values through the derived signals", async () => {
    getAppInfo.mockReturnValue(
      of(mockAppInfo({ allowPasswordLogin: false, enableOidc: true, oidcProviderName: "My Provider" })) as never,
    );

    await appInfoService.initialize();

    expect(appInfoService.allowPasswordLogin$()).toBe(false);
    expect(appInfoService.enableOidc$()).toBe(true);
    expect(appInfoService.oidcProviderName$()).toBe("My Provider");
  });

  it("should store the fetched startup info and expose isFirstLogin through the derived signal", async () => {
    getStartupInfo.mockReturnValue(of(mockStartupInfo({ isFirstLogin: true })) as never);

    await appInfoService.initialize();

    expect(getStartupInfo).toHaveBeenCalledOnce();
    expect(appInfoService.startupInfo$()).toEqual({ isFirstLogin: true, isDemo: false });
    expect(appInfoService.isFirstLogin$()).toBe(true);
  });

  it("should swallow startup info fetch failures and keep isFirstLogin false", async () => {
    getStartupInfo.mockReturnValue(throwError(() => new Error("network down")));

    await appInfoService.initialize();

    expect(appInfoService.startupInfo$()).toBeNull();
    expect(appInfoService.isFirstLogin$()).toBe(false);
    // The app info fetch is independent and still settles
    expect(appInfoService.info$()).toEqual(mockAppInfo());
  });
});
