---
name: angular-unit-tests
description: Writes and updates unit tests for the Angular project. Covers Vitest with TestBed, RouterTestingHarness for routing, ITranslateService mocking for ngx-translate, and Angular Material component harnesses. Use when creating or modifying .spec.ts files.
---

# Angular Unit Testing Guidelines

Project uses **Vitest** via `@angular/build:unit-test` (Angular 22). Tests live as `.spec.ts` files alongside source files. Path alias `@testing/` maps to `src/testing/`.

**Full testing overview:** https://github.com/angular/angular/raw/refs/heads/main/adev/src/content/guide/testing/overview.md

## Shared Testing Utilities

The `@testing/` path alias maps to `src/testing/`. This directory contains shared mocks and utilities used across multiple test files. Before creating a new mock in a spec file, check here for an existing utility.

Available utilities:

- **`mockAppInfo`** (`@testing/app-info.mock`) — `AppInfo` factory with safe defaults; accepts `Partial<AppInfo>` overrides.
- **`mockLocalStorage`** (`@testing/local-storage.mock`) — mocks `window.localStorage` for auth state. Always starts empty — never call `clear()` on top of it.
- **`mockLocation`** (`@testing/location.mock`) — mocks `window.location` with a configurable URL. It does **not** restore the original: capture the descriptor at module level (`const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, "location")`) and restore it in `afterEach` with `Object.defineProperty(window, "location", originalLocationDescriptor)`.
- **`MockMatSnackBar`** (`@testing/mat-snack-bar.mock`) — `MatSnackBar` double whose `open` is a `vi.fn()`. Provide it as `{ provide: MatSnackBar, useValue: new MockMatSnackBar() }` and inject it back for assertions.
- **`MockMatIconRegistry`** (`@testing/mock-icons.mock`) — `MatIconRegistry` double whose `getNamedSvgIcon` returns a dummy `<svg>` for **any** icon name, so specs never need to know or register the icons a template uses. Provide it as `{ provide: MatIconRegistry, useValue: new MockMatIconRegistry() }`.
- **`mockTranslateService`** (`@testing/translate-service.mock`) — partial fake `TranslateService` whose `instant()`/`get()` return `[key]`. Use this for component tests instead of seeding translation strings per spec.
- **`createMockUser`** (`@testing/user.mock`) — `UserOut` factory with safe defaults; accepts `Partial<UserOut>` overrides.
- **`mockActivatedRoute` / `mockRouterState` / `mockParseUrl`** (`@testing/route.mock`) — guard-test factories: an `ActivatedRouteSnapshot` (optionally shaped with `params`/`queryParams`), a `RouterStateSnapshot`, and a `Router.parseUrl` spy. Create `mockRoute` fresh per test (in `beforeEach`), never as a mutated module-level const.

Place new shared mocks and testing utilities in this directory rather than duplicating them across spec files.  
Update this list if you add a new shared testing utility.

## Running Tests

Use `task` commands (from the repo root) for full runs:

```bash
task angular:test    # run the full test suite once (no watch)
task angular:lint    # run the linter
task angular:check   # lint + tests
```

To test a specific file or directory (preferred for fast iteration), run the command **from the `angular` directory** with the `--include` flag:

```bash
cd angular
pnpm run test --no-watch --include "src/app/app.spec.ts"
```

Glob patterns are relative to the `angular` project root. Verify the pattern matches the actual `.spec.ts` file path before using it. Use `--no-watch` to run once instead of watch mode.

## TestBed Setup Pattern

Provide only the dependencies the component under test actually needs. Do not import `appConfig` — configure providers manually for isolation.

**Full guide:** https://github.com/angular/angular/raw/refs/heads/main/adev/src/content/guide/testing/components-basics.md

Key points from the guide:

- `createComponent()` does **not** trigger change detection synchronously — always `await fixture.whenStable()` before asserting on bound values.
- Do not re-configure `TestBed` after calling `createComponent()` — it freezes the definition.
- Use `fixture.componentInstance` for the component instance, `fixture.nativeElement` for the root DOM element.
- Prefer `await fixture.whenStable()` over manual `fixture.detectChanges()` — it handles async rendering properly.

```ts
import { provideHttpClient } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { provideTranslateService } from "@ngx-translate/core";

beforeEach(async () => {
  mockLocalStorage();

  await TestBed.configureTestingModule({
    imports: [MyComponent],
    providers: [provideHttpClient(), provideRouter([]), provideTranslateService({ fallbackLang: "en-US" })],
  }).compileComponents();

  fixture = TestBed.createComponent(MyComponent);
  await fixture.whenStable();
});
```

## Common Testing Scenarios

**Full guide:** https://github.com/angular/angular/raw/refs/heads/main/adev/src/content/guide/testing/components-scenarios.md

Key patterns from the guide:

### Component with inputs/outputs

Set inputs via `fixture.componentRef.setInput('name', value)`. Subscribe to outputs explicitly or use a test host component.

### Simulating user input on `<input>` elements

Setting `input.value` alone is not enough — Angular won't detect the change. Must also dispatch the event:

```ts
inputElement.value = "new value";
inputElement.dispatchEvent(new Event("input"));
await fixture.whenStable();
```

### Clicking elements

Use `DebugElement.triggerEventHandler('click', { button: 0 })` or `nativeElement.click()`. For `RouterLink`, the event object with `button: 0` is required.

### Stubbing nested components

Use `TestBed.overrideComponent` with `NO_ERRORS_SCHEMA` to skip rendering child components that aren't relevant to the test:

```ts
TestBed.configureTestingModule({ ... }).overrideComponent(App, {
  set: { schemas: [NO_ERRORS_SCHEMA] },
});
```

### Overriding component providers

`TestBed.overrideComponent` can replace a component's own `providers` array with test doubles:

```ts
TestBed.configureTestingModule({ ... }).overrideComponent(HeroDetail, {
  set: { providers: [{ provide: HeroDetailService, useClass: HeroDetailServiceSpy }] },
});
```

### Page Object pattern

Encapsulate DOM queries in a `Page` class for complex components:

```ts
class Page {
  get saveBtn() {
    return this.query<HTMLButtonElement>('button[type="save"]');
  }
  private query<T>(sel: string): T {
    return fixture.nativeElement.querySelector(sel) as T;
  }
}
```

## Testing Services

**Full guide:** https://github.com/angular/angular/raw/refs/heads/main/adev/src/content/guide/testing/services.md

Key points:

- Use `TestBed.inject(Service)` to get an instance — injects from the test root injector.
- Replace dependencies with stubs via `providers: [{ provide: DepService, useValue: stub }]`.
- Use Vitest's `vi.fn()` for spies to verify interactions.
- Use `afterEach` to clean up spies. Choose the method that fits:
  - `mockClear()` — resets call counts, keeps the mock active and its implementation.
  - `mockReset()` — resets call counts and implementation (reverts to returning `undefined`).
  - `mockRestore()` — removes the spy entirely, restoring the original function. Use this when spies are recreated in `beforeEach`.
  - `vi.restoreAllMocks()` — restores all spies at once.
- For HTTP services, use `HttpTestingController` (see `@angular/common/http/testing`).

```ts
const taxCalculatorStub: Mocked<TaxCalculator> = { calculate: vi.fn() };
taxCalculatorStub.calculate.mockReturnValue(5);

TestBed.configureTestingModule({
  providers: [{ provide: TaxCalculator, useValue: taxCalculatorStub }],
});
```

## Testing Routing

Use `RouterTestingHarness` from `@angular/router/testing` — never mock the `Router`.

**Full guide:** https://github.com/angular/angular/raw/refs/heads/main/adev/src/content/guide/routing/testing.md

Key points from the guide:

- **Never mock `Router` or `ActivatedRoute`** — provide real route configurations and use the harness to navigate. Mocks hide real router bugs.
- Use `harness.navigateByUrl(url, Component)` to navigate and get the rendered component instance.
- Use `harness.routeNativeElement` to inspect rendered content.
- For named outlets, `RouterTestingHarness` is not sufficient — create a custom test host component with `<router-outlet name="sidebar">`.
- All harness navigation is async — always `await` navigation calls.

```ts
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";

describe("UserProfile", () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfile],
      providers: [provideRouter([{ path: "user/:id", component: UserProfile }])],
    });

    harness = await RouterTestingHarness.create();
  });

  it("should display user ID from route params", async () => {
    await harness.navigateByUrl("/user/123", UserProfile);
    expect(harness.routeNativeElement.textContent).toContain("User Profile: 123");
  });
});
```

## Testing Attribute Directives

**Full guide:** https://github.com/angular/angular/raw/refs/heads/main/adev/src/content/guide/testing/attribute-directives.md

Key points:

- Directives cannot be created via `TestBed.createComponent` — create a test host component that uses the directive.
- Use `By.directive(DirectiveClass)` to find all elements with the directive attached.
- Access the directive instance via `debugElement.injector.get(DirectiveClass)`.

```ts
@Component({
  imports: [Highlight],
  template: `<p [highlight]="color()">{{ color() }}</p>`,
})
class Test {
  readonly color = input("");
}

const fixture = TestBed.createComponent(Test);
const des = fixture.debugElement.queryAll(By.directive(Highlight));
```

## Testing Pipes

**Full guide:** https://github.com/angular/angular/raw/refs/heads/main/adev/src/content/guide/testing/pipes.md

Key points:

- Pure pipes are stateless — instantiate directly and call `transform()`, no TestBed needed.
- Add DOM tests in component specs to verify the pipe works within a template context.

```ts
const pipe = new TitleCasePipe();
expect(pipe.transform("abc")).toBe("Abc");
```

## Testing with ngx-translate

`@ngx-translate/core` exposes `ITranslateService` as a type contract for test fakes. Two approaches:

**Full guide:** https://github.com/CodeAndWeb/ngx-translate.org/raw/refs/heads/main/src/content/docs/30-recipes/50-testing-with-itranslateservice.md

### Option A: Shared `mockTranslateService` (most common)

For component tests that only need `instant()` or `get()`, use the shared mock from `@testing/translate-service.mock`:

```ts
import { TranslateService } from "@ngx-translate/core";
import { mockTranslateService } from "@testing/translate-service.mock";

TestBed.configureTestingModule({
  providers: [{ provide: TranslateService, useValue: mockTranslateService }],
});
```

### Option B: Real service with seeded translations

When you need to test interpolation, parser behavior, or fallback chains — use the real service:

```ts
TestBed.configureTestingModule({
  providers: [provideTranslateService({ fallbackLang: "en-US" })],
});

const translate = TestBed.inject(TranslateService);
translate.setTranslation("en-US", { greeting: "Hello {{ name }}" });
await firstValueFrom(translate.use("en-US"));

expect(translate.instant("greeting", { name: "World" })).toBe("Hello World");
```

Prefer Option A for simple component tests. Use Option B when testing translation-specific behavior.

## Angular Material Component Harnesses

Use Angular Material harnesses instead of DOM queries. They make tests more readable and resilient to internal DOM changes.

Guide on how to use material Component Harnesses can be found here: <https://github.com/angular/components/raw/refs/heads/main/guides/using-component-harnesses.md>.
When testing material components use the material test harnesses over document queries.

Material harness gotchas learned in practice:

- **`enterText`/`sendKeys` append to the existing value** — call `await harness.clear()` before `enterText` on pre-filled inputs, or your text concatenates onto the current value.
- **String `text`/`stringMatches` filters match exactly** — use a RegExp (e.g. `text: /German/`) for partial matching; a string like `"German"` only matches options whose _entire_ text is `"German"`.
- **Black-box `mat-autocomplete` panel recipe in jsdom** (no component internals needed):
  - `harness.focus()` opens the panel once; the component's `opened` handler typically closes it immediately — use this as a "prime".
  - To re-open after a close: `inputElement.click()` (a plain focus is not enough).
  - To close without selecting: `inputElement.blur()` then `document.body.click()` — the document-click stream requires the input to be unfocused, so blur first. Escape is not viable this way: the keydown listener is on the overlay element, not the input.

## Custom Components Harnesses

**Overview:** https://github.com/angular/angular/raw/refs/heads/main/adev/src/content/guide/testing/component-harnesses-overview.md
**Using harnesses:** https://github.com/angular/angular/raw/refs/heads/main/adev/src/content/guide/testing/using-component-harnesses.md
**Creating harnesses:** https://github.com/angular/angular/raw/refs/heads/main/adev/src/content/guide/testing/creating-component-harnesses.md
**Custom environments:** https://github.com/angular/angular/raw/refs/heads/main/adev/src/content/guide/testing/component-harnesses-testing-environments.md

Key points from the guides:

- **Harnesses are always async** — use `async/await`. All methods return `Promise`.
- Harnesses call `detectChanges()` and wait for stability automatically — you don't need manual calls.
- Use `HarnessLoader.getHarness()` for a single component, `getAllHarnesses()` for multiple.
- Use `HarnessPredicate` via `Harness.with({ selector, text })` to filter by CSS selector or text content.
- Use `getChildLoader(selector)` to scope searches to a sub-section of the DOM.
- For elements outside the fixture (e.g., overlays appended to `document.body`), use `TestbedHarnessEnvironment.documentRootLoader(fixture)`.
- Use `parallel()` to read multiple properties simultaneously for performance.
- Use `manualChangeDetection()` block when you need finer control over change detection timing.

```ts
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";

import { MatButtonHarness } from "@angular/material/button/testing";

describe("MyComponent", () => {
  let fixture: ComponentFixture<MyComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent, MatButtonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it("should call click handler when button is clicked", async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: "Submit" }));
    await button.click();
    expect(fixture.componentInstance.onSubmit).toHaveBeenCalled();
  });
});
```

## Async Operations and Fake Timers

Vitest does not use zone.js, so `fakeAsync`/`tick` are not available. Use native `async/await` and Vitest fake timers for controlling async timing.

```ts
vi.useFakeTimers();
// ... test code ...
await vi.runAllTimersAsync();
// ... assert statements ...
vi.useRealTimers();
```

Use `vi.runAllTimersAsync()` to flush pending macrotasks before asserting on state that depends on those operations completing.

## Suppressing Expected Console Output

Suppress expected `console.log`, `console.warn`, and `console.error` output to keep test results clean. Use Vitest spies to capture and restore console methods.

```ts
beforeEach(() => {
  vi.spyOn(console, "warn").mockReturnValue();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

For individual tests, suppress within the `it` block:

```ts
it("should warn but succeed", () => {
  const warnSpy = vi.spyOn(console, "warn").mockReturnValue();
  // ... test code that produces expected warnings ...
  warnSpy.mockRestore();
});
```

Use this judiciously — only suppress output you know is expected and not indicative of a real problem. Unsuppressed warnings in test output help surface unexpected issues.

## General Standards

1. **One feature per test** — keep tests focused on a single behavior. Multiple assertions are fine when verifying related outcomes of one feature.
2. **Use native `async/await`** — Vitest does not support `fakeAsync`/`tick`.
3. **No implementation details** — test behavior, not internal state or DOM structure.
4. **Arrange-Act-Assert** — structure each test clearly in three phases.
5. **Clean up side effects** — restore mocks, clear localStorage, etc., in `beforeEach`.
6. **Clean up spies in `afterEach` with `vi.restoreAllMocks()`** — prefer one `vi.restoreAllMocks()` in `afterEach` over scattering per-spy `mockRestore()` calls inside test bodies.
7. **Suppress expected console output** — use `vi.spyOn(console, "warn").mockReturnValue()` in `beforeEach` to keep test output clean.
8. **No white-box access** — never read or mutate protected/private members of the unit under test (no bracket access, no cast helpers). Observe behavior through the DOM, harnesses, and collaborator mocks (e.g. firing a mocked `MatDialogRef.beforeClosed` subject as the "dialog starts closing" handle).
9. **No `TestBed.resetTestingModule()` inside tests** — use a file-local factory (e.g. `createService(...)`) that builds a fresh instance per test instead.
10. **Guard redirect tests must assert the destination** — assert `command.redirectTo`, `navigationBehaviorOptions` (e.g. `{ skipLocationChange: true }`), and the `parseUrl` call — not just `toBeInstanceOf(RedirectCommand)`.
11. **Template event bindings must target outputs that exist** — if a binding references an output the installed library version does not declare, it silently never fires; verify outputs against the library source/d.ts instead of assuming.

## Finishing Checks

Before finishing, run diagnostics on the test file to ensure there are no linting or type errors:

```
diagnostics(path: "path/to/test.spec.ts")
```

If diagnostics report errors, fix them before considering the task complete. Do not skip this step.
