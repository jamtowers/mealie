import type { AppInfo } from "@api/models/app-info";

export function mockAppInfo(overrides: Partial<AppInfo> = {}): AppInfo {
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
