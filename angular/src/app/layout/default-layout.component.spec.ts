import { MediaMatcher } from "@angular/cdk/layout";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { provideHttpClient } from "@angular/common/http";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";
import { RouterOutlet } from "@angular/router";
import { provideRouter } from "@angular/router";

import { MatDialog } from "@angular/material/dialog";
import { MatIconRegistry } from "@angular/material/icon";
import { MatSidenavHarness } from "@angular/material/sidenav/testing";

import { TranslateService } from "@ngx-translate/core";

import type { UserOut } from "@api/models/user-out";
import { AuthService } from "@app/auth/auth.service";
import { mockDomSanitizer } from "@testing/dom-sanitizer.mock";
import { mockLocalStorage } from "@testing/local-storage.mock";
import { mockSvgIcons } from "@testing/mock-icons.mock";
import { mockTranslateService } from "@testing/translate-service.mock";
import { ThemeService } from "@theme/theme.service";

import DefaultLayout from "./default-layout.component";

const DEFAULT_LAYOUT_ICONS = [
  "menu",
  "silverware-variant",
  "translate",
  "magnify",
  "logout",
  "heart",
  "plus",
  "file-cabinet",
  "theme-light-dark",
  "silverware-fork-knife",
  "calendar-multiselect",
  "format-list-checks",
  "timeline-text",
  "book-open-page-variant",
  "shape-outline",
  "tag-multiple-outline",
  "pot-steam-outline",
  "link",
  "square-edit-outline",
];

class MatDialogStub {
  open = vi.fn();
}

const mockUser: UserOut = {
  id: "test-user-id",
  username: "testuser",
  fullName: "Test User",
  email: "test@example.com",
  group: "group-id",
  household: "household-id",
  groupId: "group-id",
  groupSlug: "test-group",
  householdId: "household-id",
  householdSlug: "test-household",
  cacheKey: "abc123",
};

class AuthServiceStub {
  readonly user$ = signal<UserOut | null>(mockUser);
  signOut = vi.fn();
}

class ThemeServiceStub {
  currentModeIcon = signal("theme-light-dark");
  currentModeTranslateKey = signal("settings.theme.auto-mode");
  cycle = vi.fn();
}

class MediaMatcherStub {
  matchMedia() {
    return {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    };
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
        { provide: DomSanitizer, useValue: mockDomSanitizer },
        { provide: MatDialog, useClass: MatDialogStub },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;

    // Register mock SVG icons so MatIcon doesn't error
    mockSvgIcons(TestBed.inject(MatIconRegistry), DEFAULT_LAYOUT_ICONS);

    fixture = TestBed.createComponent(DefaultLayout);
    await fixture.whenStable();
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
      const buttons = fixture.nativeElement.querySelectorAll("mat-toolbar button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should render theme toggle and language button components", () => {
      expect(fixture.nativeElement.querySelector("mealie-theme-toggle-button")).toBeTruthy();
      expect(fixture.nativeElement.querySelector("mealie-language-button")).toBeTruthy();
    });

    it("should call auth.signOut when logout button is clicked", async () => {
      const signOutSpy = vi.spyOn(authService, "signOut");

      const buttons = fixture.nativeElement.querySelectorAll("mat-toolbar > button");
      const logoutButton = buttons[buttons.length - 1];
      await logoutButton.click();
      await fixture.whenStable();
      expect(signOutSpy).toHaveBeenCalled();
    });
  });

  describe("sidenav", () => {
    it("should toggle sidenav open/closed when toggle button is clicked", async () => {
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const sidenav = await loader.getHarness(MatSidenavHarness);

      // In mobile mode (isMobile=true), sidenav is closed
      expect(await sidenav.isOpen()).toBe(false);

      const toggleButton = fixture.nativeElement.querySelector("mat-toolbar button:first-of-type");
      await toggleButton.click();
      await fixture.whenStable();

      expect(await sidenav.isOpen()).toBe(true);

      await toggleButton.click();
      await fixture.whenStable();

      expect(await sidenav.isOpen()).toBe(false);
    });

    it("should have sidenav closed in mobile mode", () => {
      const component = fixture.componentInstance as unknown as { isMobile: () => boolean };
      expect(component.isMobile()).toBe(true);
    });

    it("should have sidenav open in desktop mode", async () => {
      const mediaMatcher = TestBed.inject(MediaMatcher);
      const matchMediaSpy = vi.spyOn(mediaMatcher, "matchMedia").mockImplementation(
        () =>
          ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
          }) as unknown as MediaQueryList,
      );

      fixture.destroy();
      fixture = TestBed.createComponent(DefaultLayout);
      await fixture.whenStable();

      const desktopComponent = fixture.componentInstance as unknown as { isMobile: () => boolean };
      expect(desktopComponent.isMobile()).toBe(false);

      matchMediaSpy.mockRestore();
    });

    it("should link to user profile page", () => {
      const userBox = fixture.nativeElement.querySelector("#user-box");
      expect(userBox.hasAttribute("routerLink")).toBe(true);
    });

    it("should have 2 create links defined", () => {
      const component = fixture.componentInstance as unknown as { createLinks: readonly unknown[] };
      expect(component.createLinks.length).toBe(2);
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

  describe("logout button", () => {
    it("should show logout as icon button in mobile mode", () => {
      const logoutButton = fixture.nativeElement.querySelector("mat-toolbar button:last-of-type");
      expect(logoutButton).toBeTruthy();
    });

    it("should not show user info when not authenticated", () => {
      authService.user$.set(null);
      fixture.detectChanges();

      const nameElement = fixture.nativeElement.querySelector("#user-box .name");
      expect(nameElement.textContent?.trim()).toBe("");
    });
  });

  describe("cleanup", () => {
    it("should remove media query listener on destroy", () => {
      const component = fixture.componentInstance as unknown as { _mobileQuery: MediaQueryList };
      const removeEventListenerSpy = vi.spyOn(component._mobileQuery, "removeEventListener");

      fixture.destroy();
      expect(removeEventListenerSpy).toHaveBeenCalledWith("change", expect.any(Function));
    });
  });
});
