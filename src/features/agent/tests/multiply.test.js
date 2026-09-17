import { describe, expect, it } from "vitest";
import { multiply, runMultiplyTool } from "../tools/multiply.js";

describe("multiply tool", () => {
  it("multiplies two numbers", () => {
    expect(multiply(42, 2)).toBe(84);
  });

  it("parses tool arguments json", () => {
    expect(runMultiplyTool('{"a":42,"b":2}')).toBe(84);
  });
});
