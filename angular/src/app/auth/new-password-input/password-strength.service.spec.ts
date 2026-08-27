import { PasswordStrengthService } from "./password-strength.service";

describe("PasswordStrengthService", () => {
  let service: PasswordStrengthService;

  beforeEach(() => {
    service = new PasswordStrengthService();
  });

  describe("score", () => {
    it("returns 0 for an empty password", () => {
      expect(service.score("")).toBe(0);
    });

    it("returns 0 for a password shorter than 6 characters", () => {
      expect(service.score("abcde")).toBe(0);
    });

    it("returns 0 when the password contains a flagged word", () => {
      for (const pass of ["password", "PASSWORD123", "xmealieX", "admin123", "qwerty12", "login1234"]) {
        expect(service.score(pass)).toBe(0);
      }
    });

    it("awards 5 points for each unique character", () => {
      // 6 unique characters -> 6 * 5 = 30, no variation bonus (lowercase only)
      expect(service.score("abcdef")).toBe(30);
    });

    it("decreases the points awarded for repeated characters", () => {
      // 5 * (1 + 1/2 + 1/3 + 1/4 + 1/5 + 1/6) = 12.25
      expect(service.score("aaaaaa")).toBeCloseTo(12.25, 5);
    });

    it("adds a bonus for mixed character variations", () => {
      // 10 unique characters -> 50, digits + lowercase -> +10
      expect(service.score("abcdef1234")).toBe(60);
      // 6 unique characters -> 30, digits + lowercase + uppercase -> +20
      expect(service.score("ab34XY")).toBe(50);
    });

    it("clamps the score to 100", () => {
      expect(service.score("abcdefghijklmnopqrst1234XYZW!@#$")).toBe(100);
    });
  });

  describe("strength", () => {
    it("maps scores to strength buckets", () => {
      expect(service.strength(0)).toBe("weak");
      expect(service.strength(49.99)).toBe("weak");
      expect(service.strength(50)).toBe("good");
      expect(service.strength(79.99)).toBe("good");
      expect(service.strength(80)).toBe("strong");
      expect(service.strength(99.99)).toBe("strong");
      expect(service.strength(100)).toBe("very-strong");
    });
  });
});
