/** 试调用：乘法 function 工具（模型只出参，由前端执行） */
export const MULTIPLY_TOOL = {
  name: "multiply",
  description: "计算两个数字的积。需要做乘法时必须调用本工具，不要口算。",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number", description: "第一个因数" },
      b: { type: "number", description: "第二个因数" }
    },
    required: ["a", "b"]
  }
};

export function multiply(a, b) {
  return Number(a) * Number(b);
}

/** @param {string} argumentsJson */
export function runMultiplyTool(argumentsJson) {
  const args = JSON.parse(argumentsJson || "{}");
  if (Number.isNaN(Number(args.a)) || Number.isNaN(Number(args.b))) {
    throw new Error("multiply 参数不是数字");
  }
  return multiply(args.a, args.b);
}
