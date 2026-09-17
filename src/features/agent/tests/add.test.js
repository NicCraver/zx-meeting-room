import { describe, expect, it } from "vitest";
import { add, runAddTool } from "../tools/add.js";

describe("add tool", () => {
  it("adds two numbers", () => {
    expect(add(17, 25)).toBe(42);
  });

  it("parses tool arguments json", () => {
    expect(runAddTool('{"a":17,"b":25}')).toBe(42);
  });
});
