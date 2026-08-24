import { isSafeRedirectTarget } from "./redirect";

describe("isSafeRedirectTarget", () => {
  it("should accept plain in-app paths", () => {
    expect(isSafeRedirectTarget("/")).toBe(true);
    expect(isSafeRedirectTarget("/g/default")).toBe(true);
    expect(isSafeRedirectTarget("/recipes")).toBe(true);
  });

  it("should accept in-app paths with query params", () => {
    expect(isSafeRedirectTarget("/recipes?tag=pie")).toBe(true);
    expect(isSafeRedirectTarget("/login?direct=1")).toBe(true);
  });

  it("should reject empty and nullish targets", () => {
    expect(isSafeRedirectTarget("")).toBe(false);
    expect(isSafeRedirectTarget(null)).toBe(false);
    expect(isSafeRedirectTarget(undefined)).toBe(false);
  });

  it("should reject protocol-relative targets", () => {
    expect(isSafeRedirectTarget("//evil.com")).toBe(false);
    expect(isSafeRedirectTarget("/\\evil.com")).toBe(false);
    expect(isSafeRedirectTarget("\\evil.com")).toBe(false);
  });

  it("should reject absolute urls and relative paths", () => {
    expect(isSafeRedirectTarget("https://evil.com")).toBe(false);
    expect(isSafeRedirectTarget("relative/path")).toBe(false);
  });
});
