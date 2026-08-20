import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Title } from "@angular/platform-browser";
import { Routes, provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";

import { MatIconRegistry } from "@angular/material/icon";

import { ITranslateService, TranslateService, provideTranslateService } from "@ngx-translate/core";
import { lastValueFrom, of } from "rxjs";

import { mockLocalStorage } from "@testing/local-storage.mock";

import { App } from "./app";

@Component({
  selector: "app-empty",
  template: "",
})
class EmptyComponent {}

@Component({
  selector: "app-login",
  template: "",
})
class LoginComponent {}

@Component({
  selector: "app-dashboard",
  template: "",
})
class DashboardComponent {}

@Component({
  selector: "app-child",
  template: "",
})
class ChildComponent {}

describe("App", () => {
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    mockLocalStorage();

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: "en-US" }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    await fixture.whenStable();
  });

  afterEach(() => {
    // Verify that none of the tests make any extra HTTP requests.
    TestBed.inject(HttpTestingController).verify();
  });

  it("should create the app", () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("should render a router-outlet", () => {
    const outlet = fixture.nativeElement.querySelector("router-outlet");
    expect(outlet).toBeTruthy();
  });

  it("should instantiate TranslateService", () => {
    expect(TestBed.inject(TranslateService)).toBeTruthy();
  });

  it("should register SVG icon set", async () => {
    const httpTesting = TestBed.inject(HttpTestingController);

    const iconRegistry = TestBed.inject(MatIconRegistry);

    expect(iconRegistry).toBeTruthy();

    const mealieIcon = lastValueFrom(iconRegistry.getNamedSvgIcon("silverware-variant"));

    const req = httpTesting.expectOne("./assets/mdi.svg", "Request to load the icon file");

    // We resolve the request by using a string with just the icon in question from the icon library
    // I really would have liked to use the actual icon library file to ensure it works through updates and such
    // but alas I couldn't find a way to load the svg in the testing env, so here we are.
    req.flush(
      `<svg><defs><svg id="silverware-variant" viewBox="0 0 24 24"><path d="M8.1,13.34L3.91,9.16C2.35,7.59 2.35,5.06 3.91,3.5L10.93,10.5L8.1,13.34M13.41,13L20.29,19.88L18.88,21.29L12,14.41L5.12,21.29L3.71,19.88L13.36,10.22L13.16,10C12.38,9.23 12.38,7.97 13.16,7.19L17.5,2.82L18.43,3.74L15.19,7L16.15,7.94L19.39,4.69L20.31,5.61L17.06,8.85L18,9.81L21.26,6.56L22.18,7.5L17.81,11.84C17.03,12.62 15.77,12.62 15,11.84L14.78,11.64L13.41,13Z"/></svg></defs></svg>`,
    );

    expect(await mealieIcon).toBeTruthy();
  });
});

describe("App - Page Title", () => {
  let fixture: ComponentFixture<App>;
  let harness: RouterTestingHarness;

  const translations: Record<string, string> = {
    "login.login": "Login",
    "general.appTitle": "Dashboard",
  };

  const fakeTranslate: Partial<ITranslateService> = {
    currentLang: signal("en-US"),
    get: (key: string | string[]) => of(translations[key as string] ?? key),
  };

  const routes: Routes = [
    {
      path: "login",
      component: LoginComponent,
      data: { title: "login.login" },
    },
    {
      path: "",
      component: DashboardComponent,
      data: { title: "general.appTitle" },
      children: [
        {
          path: "child",
          component: ChildComponent,
          data: { title: "child.title" },
        },
        {
          path: "empty-child",
          component: EmptyComponent,
        },
      ],
    },
    {
      path: "no-title",
      component: EmptyComponent,
    },
  ];

  beforeEach(async () => {
    mockLocalStorage();

    await TestBed.configureTestingModule({
      imports: [App, LoginComponent, DashboardComponent, ChildComponent, EmptyComponent],
      providers: [provideRouter(routes), provideHttpClient(), { provide: TranslateService, useValue: fakeTranslate }],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    vi.spyOn(TestBed.inject(Title), "setTitle");

    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should set translated title when route has a title key", async () => {
    await harness.navigateByUrl("/login", LoginComponent);
    await fixture.whenStable();

    expect(TestBed.inject(Title).setTitle).toHaveBeenCalledWith("Mealie - Login");
  });

  it("should set translated title for parent route", async () => {
    await harness.navigateByUrl("/", DashboardComponent);
    await fixture.whenStable();

    expect(TestBed.inject(Title).setTitle).toHaveBeenCalledWith("Mealie - Dashboard");
  });

  it("should fall back to default title when route has no title key", async () => {
    await harness.navigateByUrl("/no-title", EmptyComponent);
    await fixture.whenStable();

    expect(TestBed.inject(Title).setTitle).toHaveBeenCalledWith("Mealie");
  });

  it("should use child route title when child has a title key", async () => {
    await harness.navigateByUrl("/child");
    await fixture.whenStable();

    expect(TestBed.inject(Title).setTitle).toHaveBeenCalledWith("Mealie - child.title");
  });

  it("should use parent title when child route has no title key", async () => {
    await harness.navigateByUrl("/empty-child");
    await fixture.whenStable();

    expect(TestBed.inject(Title).setTitle).toHaveBeenCalledWith("Mealie - Dashboard");
  });
});
