import { test } from "vitest";
import assert from "node:assert/strict";
import { dictDeleteBlockedMessage, dictNameError } from "../dictRules.js";

const items = [
  { id: "d1", type: "building", name: "奥城" },
  { id: "d2", type: "facility", name: "奥城" }
];

test("空名 / 超长 / 同类型重名", () => {
  assert.equal(dictNameError({ name: "", items, type: "building" }), "请输入名称");
  assert.equal(
    dictNameError({ name: "啊".repeat(21), items, type: "building" }),
    "名称不超过 20 个字"
  );
  assert.equal(
    dictNameError({ name: "奥城", items, type: "building" }),
    "同类型下已有相同名称"
  );
  assert.equal(
    dictNameError({ name: "奥城", items, type: "building", editingId: "d1" }),
    ""
  );
  assert.equal(
    dictNameError({ name: "奥城", items, type: "facility", editingId: "new" }),
    "同类型下已有相同名称"
  );
});

test("引用保护文案", () => {
  assert.equal(dictDeleteBlockedMessage({ name: "奥城", usageCount: 0 }), "");
  assert.equal(
    dictDeleteBlockedMessage({ name: "奥城", usageCount: 2 }),
    "有 2 间会议室正在使用「奥城」，无法删除"
  );
});
