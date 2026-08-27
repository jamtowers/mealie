import { MediaMatcher } from "@angular/cdk/layout";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { provideHttpClient } from "@angular/common/http";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterOutlet } from "@angular/router";
import { provideRouter } from "@angular/router";

import { MatDialog } from "@angular/material/dialog";
import { MatIconRegistry } from "@angular/material/icon";
import { MatMenuHarness } from "@angular/material/menu/testing";
import { MatSidenavHarness } from "@angular/material/sidenav/testing";

import { TranslateService } from "@ngx-translate/core";

import type { UserOut } from "@api/models/user-out";
import { AuthService } from "@app/auth/auth.service";
import { mockLocalStorage } from "@testing/local-storage.mock";
import { MockMatIconRegistry } from "@testing/mock-icons.mock";
import { mockTranslateService } from "@testing/translate-service.mock";
import { createMockUser } from "@testing/user.mock";
import { ThemeService } from "@theme/theme.service";

import DefaultLayout from "./default-layout.component";

class MatDialogStub {
  open = vi.fn();
}

const mockUser = createMockUser();

class AuthServiceStub {
  readonly user$ = signal<UserOut | null>(mockUser);
  signOut = vi.fn();
}

class ThemeServiceStub {
  currentModeIcon = signal("theme-light-dark");
  currentModeTranslateKey = signal("settings.theme.auto-mode");
  cycle = vi.fn();
}

/**
 * A MediaQueryList-shaped stub. `mobileQuery` is the shared instance the
 * `MediaMatcher` stub returns, so tests can observe the component's media
 * query interactions without reaching into component internals.
 */
function mockMediaQuery(matches: boolean) {
  return {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
}

const mobileQuery = mockMediaQuery(true);

class MediaMatcherStub {
  matchMedia() {
    return mobileQuery;
  }
}

@Component({
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
class TestHostComponent {}

describe("DefaultLayout", () => {
  let fixture: ComponentFixture<DefaultLayout>;
  let authService: AuthServiceStub;

  async function createFixture() {
    const fixture = TestBed.createComponent(DefaultLayout);
    await fixture.whenStable();
    return fixture;
  }

  function getLogoutButton(): HTMLButtonElement {
    const logoutIcon = fixture.nativeElement.querySelector("mat-toolbar mat-icon[svgIcon='logout']")!;
    return logoutIcon.closest("button") as HTMLButtonElement;
  }

  beforeEach(async () => {
    mockLocalStorage();

    await TestBed.configureTestingModule({
      imports: [DefaultLayout, TestHostComponent],
      providers: [
        provideHttpClient(),
        provideRouter([{ path: "**", component: TestHostComponent }]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: ThemeService, useClass: ThemeServiceStub },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: MediaMatcher, useClass: MediaMatcherStub },
        { provide: MatDialog, useClass: MatDialogStub },
        { provide: MatIconRegistry, useValue: new MockMatIconRegistry() },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;

    fixture = await createFixture();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("toolbar", () => {
    it("should display Mealie branding", () => {
      expect(fixture.nativeElement.querySelector("mat-toolbar")).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain("Mealie");
    });

    it("should have a sidenav toggle button", () => {
      expect(fixture.nativeElement.querySelector("mat-toolbar mat-icon[svgIcon='menu']")).toBeTruthy();
    });

    it("should render theme toggle and language button components", () => {
      expect(fixture.nativeElement.querySelector("mealie-theme-toggle-button")).toBeTruthy();
      expect(fixture.nativeElement.querySelector("mealie-language-button")).toBeTruthy();
    });

    it("should call auth.signOut when logout button is clicked", async () => {
      const signOutSpy = vi.spyOn(authService, "signOut");

      await getLogoutButton().click();
      await fixture.whenStable();
      expect(signOutSpy).toHaveBeenCalled();
    });
  });

  describe("sidenav", () => {
    it("should toggle sidenav open/closed when toggle button is clicked", async () => {
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const sidenav = await loader.getHarness(MatSidenavHarness);

      // In mobile mode the sidenav starts closed
      expect(await sidenav.isOpen()).toBe(false);

      const toggleButton = fixture.nativeElement.querySelector("mat-toolbar button:first-of-type");
      await toggleButton.click();
      await fixture.whenStable();

      expect(await sidenav.isOpen()).toBe(true);

      await toggleButton.click();
      await fixture.whenStable();

      expect(await sidenav.isOpen()).toBe(false);
    });

    it("should have sidenav closed in mobile mode", async () => {
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const sidenav = await loader.getHarness(MatSidenavHarness);
      expect(await sidenav.isOpen()).toBe(false);
    });

    it("should link to user profile page", () => {
      const userBox = fixture.nativeElement.querySelector("#user-box");
      expect(userBox.hasAttribute("routerLink")).toBe(true);
    });

    it("should define 2 links in the create menu", async () => {
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const createMenu = await loader.getHarness(MatMenuHarness);
      await createMenu.open();
      expect((await createMenu.getItems()).length).toBe(2);
    });

    it("should display organizer links in expansion panel", () => {
      const panel = fixture.nativeElement.querySelector("mat-expansion-panel");
      const links = panel.querySelectorAll("a[mat-list-item]");
      expect(links.length).toBe(3);
    });

    it("should display user name in sidenav", () => {
      const nameElement = fixture.nativeElement.querySelector("#user-box .name");
      expect(nameElement.textContent).toContain("Test User");
    });

    it("should fallback to username when fullName is missing", () => {
      authService.user$.set({ ...mockUser, fullName: null });
      fixture.detectChanges();

      const nameElement = fixture.nativeElement.querySelector("#user-box .name");
      expect(nameElement.textContent).toContain("testuser");
    });

    it("should not show user info when not authenticated", () => {
      authService.user$.set(null);
      fixture.detectChanges();

      const nameElement = fixture.nativeElement.querySelector("#user-box .name");
      expect(nameElement.textContent?.trim()).toBe("");
    });

    it("should display user avatar with correct URL", () => {
      const avatar = fixture.nativeElement.querySelector("#user-box .avatar");
      const expectedUrl = `/api/media/users/${mockUser.id}/profile.webp?cacheKey=${mockUser.cacheKey}`;
      expect(avatar.src).toContain(expectedUrl);
    });

    it("should have favorites link with correct path", () => {
      const favLink = fixture.nativeElement.querySelector("#user-box .fav-recipes a");
      expect(favLink.getAttribute("href")).toContain(`/user/${mockUser.id}/favorites`);
    });

    it("should display top navigation links", () => {
      const navLinks = fixture.nativeElement.querySelectorAll("mat-nav-list a[mat-list-item]");
      expect(navLinks.length).toBeGreaterThan(0);
    });

    it("should display create FAB button", () => {
      const createButton = fixture.nativeElement.querySelector("#create-button");
      expect(createButton).toBeTruthy();
    });

    it("should display organizer expansion panel", () => {
      const panel = fixture.nativeElement.querySelector("mat-expansion-panel");
      expect(panel).toBeTruthy();
    });
  });

  describe("desktop mode", () => {
    beforeEach(async () => {
      const mediaMatcher = TestBed.inject(MediaMatcher);
      vi.spyOn(mediaMatcher, "matchMedia").mockReturnValue(mockMediaQuery(false) as unknown as MediaQueryList);

      // The component reads the media query during construction, so the
      // mobile fixture from the outer beforeEach must be replaced.
      fixture.destroy();
      fixture = await createFixture();
    });

    it("should have sidenav open", async () => {
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const sidenav = await loader.getHarness(MatSidenavHarness);
      expect(await sidenav.isOpen()).toBe(true);
    });

    it("should render a labeled logout button", () => {
      expect(getLogoutButton().textContent).toContain("[user.logout]");
    });
  });

  describe("logout button", () => {
    it("should render an icon-only logout button in mobile mode", () => {
      expect(getLogoutButton().textContent?.trim()).toBe("");
    });
  });

  describe("cleanup", () => {
    it("should remove media query listener on destroy", () => {
      const removeEventListenerSpy = vi.spyOn(mobileQuery, "removeEventListener");

      fixture.destroy();
      expect(removeEventListenerSpy).toHaveBeenCalledWith("change", expect.any(Function));
    });
  });
});
