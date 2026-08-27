import { Injectable } from "@angular/core";

/**
 * The strength buckets a score can map to, weakest to strongest.
 */
export type PasswordStrength = "weak" | "good" | "strong" | "very-strong";

/**
 * Passwords containing any of these (case-insensitive substrings) score 0.
 */
const FLAGGED_WORDS = ["password", "mealie", "admin", "qwerty", "login"];

@Injectable({ providedIn: "root" })
export class PasswordStrengthService {
  /**
   * Score a password between 0 and 100.
   *
   * Ported verbatim from the Nuxt `scorePassword` validator: returns 0 for an
   * empty password, a password shorter than 6 characters, or one containing a
   * flagged word; otherwise awards points per unique character plus a bonus
   * for mixing character variations, clamped to 0–100.
   */
  score(pass: string): number {
    let score = 0;
    if (!pass) return score;

    if (pass.length < 6) return score;

    // Check for flagged words
    for (const word of FLAGGED_WORDS) {
      if (pass.toLowerCase().includes(word)) {
        return 0;
      }
    }

    // Award every unique letter until 5 repetitions
    const letters: Record<string, number> = {};
    for (const ch of pass) {
      letters[ch] = (letters[ch] || 0) + 1;
      score += 5.0 / letters[ch];
    }

    // Bonus points for mixing it up
    const variationCount = Object.values({
      digits: /\d/.test(pass),
      lower: /[a-z]/.test(pass),
      upper: /[A-Z]/.test(pass),
      nonWords: /\W/.test(pass),
    }).filter(Boolean).length;
    score += (variationCount - 1) * 10;

    return Math.max(Math.min(score, 100), 0);
  }

  /** Map a score to its strength bucket (see `PasswordStrength`). */
  strength(score: number): PasswordStrength {
    if (score < 50) return "weak";
    if (score < 80) return "good";
    if (score < 100) return "strong";
    return "very-strong";
  }
}
