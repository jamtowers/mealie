import { TestBed } from "@angular/core/testing";
import { Router, UrlTree } from "@angular/router";

import type { Mock } from "vitest";

import { mockActivatedRoute, mockParseUrl, mockRouterState } from "@testing/route.mock";
import { AppInfoService } from "@utils/app-info.service";

import { allowPasswordLoginGuard } from "./allow-password-login.guard";

const mockRoute = mockActivatedRoute();
const mockState = mockRouterState();

describe("passwordLoginGuard", () => {
  let allowPasswordLogin$: Mock<() => boolean>;
  let parseUrl: Mock<(url: string) => UrlTree>;

  beforeEach(() => {
    allowPasswordLogin$ = vi.fn(() => true);
    parseUrl = mockParseUrl();

    TestBed.configureTestingModule({
      providers: [
        { provide: AppInfoService, useValue: { allowPasswordLogin$ } },
        { provide: Router, useValue: { parseUrl } },
      ],
    });
  });

  it("should allow navigation when password login is allowed", async () => {
    const result = await TestBed.runInInjectionContext(() => allowPasswordLoginGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it("should deny navigation and redirect to /login when password login is disallowed", async () => {
    allowPasswordLogin$.mockReturnValue(false);
    const loginUrl = {} as UrlTree;
    parseUrl.mockReturnValue(loginUrl);

    const result = await TestBed.runInInjectionContext(() => allowPasswordLoginGuard(mockRoute, mockState));

    expect(result).toBe(loginUrl);
    expect(parseUrl).toHaveBeenCalledWith("/login");
  });
});
