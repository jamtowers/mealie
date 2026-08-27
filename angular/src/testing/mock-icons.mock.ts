import { of } from "rxjs";
import { vi } from "vitest";

const SVGNS = "http://www.w3.org/2000/svg";

/**
 * A `MatIconRegistry` double that renders a fresh dummy `<svg>` for any icon name.
 * Provide it in place of the real registry so component specs don't need to know —
 * or register — the icons a template uses:
 *
 * ```ts
 * providers: [{ provide: MatIconRegistry, useValue: new MockMatIconRegistry() }]
 * ```
 */
export class MockMatIconRegistry {
  getNamedSvgIcon = vi.fn(() => of(document.createElementNS(SVGNS, "svg")));
}
