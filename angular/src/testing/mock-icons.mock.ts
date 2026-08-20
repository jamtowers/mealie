import { MatIconRegistry } from "@angular/material/icon";

const MOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10H0z"/></svg>`;

/**
 * Generic helper to register arbitrary mock SVG icons.
 *
 * ```ts
 * import { mockSvgIcons } from "@testing/mock-icons.mock";
 * import { mockDomSanitizer } from "@testing/dom-sanitizer.mock";
 *
 * mockSvgIcons(iconRegistry, mockDomSanitizer, ["email", "lock"]);
 * ```
 */
export function mockSvgIcons(iconRegistry: MatIconRegistry, names: string[]): void {
  for (const name of names) {
    iconRegistry.addSvgIconLiteral(name, MOCK_SVG);
  }
}
