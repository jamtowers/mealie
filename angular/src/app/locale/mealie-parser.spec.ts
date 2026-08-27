import { TestBed } from "@angular/core/testing";

import { TranslateService, provideTranslateParser, provideTranslateService } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";

import { MealieParser } from "./mealie-parser";

describe("MealieParser", () => {
  let parser: MealieParser;

  beforeEach(() => {
    parser = new MealieParser();
  });

  describe("interpolate", () => {
    it("should interpolate single-brace params", () => {
      expect(parser.interpolate("You have {count} recipes", { count: 3 })).toBe("You have 3 recipes");
    });

    it("should interpolate function expressions", () => {
      expect(parser.interpolate(() => "ok", {})).toBe("ok");
    });

    it("should keep pipes literal when no numeric param is present", () => {
      expect(parser.interpolate("A | B", { name: "x" })).toBe("A | B");
    });

    it("should keep pipes literal when the params are empty", () => {
      expect(parser.interpolate("A | B", {})).toBe("A | B");
    });

    describe("two forms (singular|plural)", () => {
      const expr = "Must Be At Most {max} Character|Must Be At Most {max} Characters";

      it("should pick the singular form for one", () => {
        expect(parser.interpolate(expr, { max: 1 })).toBe("Must Be At Most 1 Character");
      });

      it("should pick the plural form for everything else", () => {
        expect(parser.interpolate(expr, { max: 3 })).toBe("Must Be At Most 3 Characters");
      });
    });

    describe("three forms (zero|one|other)", () => {
      const expr = "No item copied to clipboard|One item copied to clipboard|Copied {count} items to clipboard";

      it("should pick the zero form for zero", () => {
        expect(parser.interpolate(expr, { count: 0 })).toBe("No item copied to clipboard");
      });

      it("should pick the one form for one", () => {
        expect(parser.interpolate(expr, { count: 1 })).toBe("One item copied to clipboard");
      });

      it("should pick the other form for everything else", () => {
        expect(parser.interpolate(expr, { count: 5 })).toBe("Copied 5 items to clipboard");
      });
    });

    it("should prefer the count param over other numeric params", () => {
      expect(parser.interpolate("Zero|One|{count} Many", { count: 2, other: 3 })).toBe("2 Many");
    });

    it("should prefer the min param over other numeric params", () => {
      expect(parser.interpolate("Must Be At Least {min} Character|Must Be At Least {min} Characters", { min: 1 })).toBe(
        "Must Be At Least 1 Character",
      );
    });

    it("should fall back to the first numeric param", () => {
      expect(parser.interpolate("days ago|day ago|days ago", { days: 1 })).toBe("day ago");
      expect(parser.interpolate("days ago|day ago|days ago", { days: 3 })).toBe("days ago");
    });
  });

  describe("with TranslateService", () => {
    it("should select the plural form from the instant params", async () => {
      await TestBed.configureTestingModule({
        providers: [
          provideTranslateService({
            fallbackLang: "en-US",
            parser: provideTranslateParser(MealieParser),
          }),
        ],
      }).compileComponents();

      const translate = TestBed.inject(TranslateService);
      translate.setTranslation("en-US", {
        "validators.max-length": "Must Be At Most {max} Character|Must Be At Most {max} Characters",
      });
      await firstValueFrom(translate.use("en-US"));

      expect(translate.instant("validators.max-length", { max: 1 })).toBe("Must Be At Most 1 Character");
      expect(translate.instant("validators.max-length", { max: 4 })).toBe("Must Be At Most 4 Characters");
    });
  });
});
