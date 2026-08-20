import { TranslateDefaultParser } from "@ngx-translate/core";

import { MealieParser } from "./mealie-parser";

describe("MealieParser", () => {
  let parser: MealieParser;

  beforeEach(() => {
    parser = new MealieParser();
  });

  it("extends TranslateDefaultParser", () => {
    expect(parser).toBeInstanceOf(TranslateDefaultParser);
  });

  describe("templateMatcher", () => {
    it("matches single-brace placeholders", () => {
      parser.templateMatcher.lastIndex = 0;
      const result = parser.templateMatcher.exec("{name}");
      expect(result).not.toBeNull();
      expect(result![1]).toBe("name");
    });

    it("matches single-brace placeholders with inner spaces", () => {
      parser.templateMatcher.lastIndex = 0;
      const result = parser.templateMatcher.exec("{ name }");
      expect(result).not.toBeNull();
      expect(result![1]).toBe("name");
    });
  });

  describe("interpolate", () => {
    it("interpolates values into single-brace placeholders", () => {
      const result = parser.interpolate("You have {count} recipes", { count: 42 });
      expect(result).toBe("You have 42 recipes");
    });

    it("interpolates multiple values", () => {
      const result = parser.interpolate("{greeting} {name}", { greeting: "Hello", name: "World" });
      expect(result).toBe("Hello World");
    });

    it("returns the original string when there are no placeholders", () => {
      const result = parser.interpolate("No placeholders here", {});
      expect(result).toBe("No placeholders here");
    });

    it("preserves placeholders for missing values", () => {
      const result = parser.interpolate("Hello {name}", {});
      expect(result).toBe("Hello {name}");
    });

    it("handles spaced placeholders", () => {
      const result = parser.interpolate("Hello { name }", { name: "Alice" });
      expect(result).toBe("Hello Alice");
    });
  });
});
