import { DomSanitizer } from "@angular/platform-browser";

/**
 * Mock `DomSanitizer` that bypasses all security checks.
 *
 * Use this when tests need to register SVG icon literals or render unsafe HTML
 * without Angular's sanitizer stripping content.
 *
 * ```ts
 * import { mockDomSanitizer } from "@testing/dom-sanitizer.mock";
 *
 * TestBed.configureTestingModule({
 *   providers: [{ provide: DomSanitizer, useValue: mockDomSanitizer }],
 * });
 * ```
 */
export const mockDomSanitizer: DomSanitizer = {
  bypassSecurityTrustHtml: (value: string) => value,
  bypassSecurityTrustScript: (value: string) => value,
  bypassSecurityTrustStyle: (value: string) => value,
  bypassSecurityTrustUrl: (value: string) => value,
  bypassSecurityTrustResourceUrl: (value: string) => value,
  sanitize: (_ctx: unknown, value: string | null) => value,
};
