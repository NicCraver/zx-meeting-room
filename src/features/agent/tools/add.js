/** 试调用：加法 function 工具（模型只出参，由前端执行） */
export const ADD_TOOL = {
  name: "add",
  description: "计算两个数字的和。需要做加法时必须调用本工具，不要口算。",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number", description: "第一个加数" },
      b: { type: "number", description: "第二个加数" }
    },
    required: ["a", "b"]
  }
};

export function add(a, b) {
  return Number(a) + Number(b);
}

/** @param {string} argumentsJson */
export function runAddTool(argumentsJson) {
  const args = JSON.parse(argumentsJson || "{}");
  if (Number.isNaN(Number(args.a)) || Number.isNaN(Number(args.b))) {
    throw new Error("add 参数不是数字");
  }
  return add(args.a, args.b);
}
