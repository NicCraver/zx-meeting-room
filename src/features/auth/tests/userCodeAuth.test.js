import { test } from "vitest";
import assert from "node:assert/strict";
import {
  bootstrapUserCodeAuth,
  pickCorpUserId,
  readUserCode,
  stripUserCode
} from "../userCodeAuth.js";

const BASE = "http://localhost:6273/ai-meet/zx/";

const fakeStorage = () => {
  const map = new Map();
  return {
    map,
    setItem: (k, v) => map.set(k, v),
    getItem: (k) => (map.has(k) ? map.get(k) : null)
  };
};

const deps = (over = {}) => {
  const storage = over.storage || fakeStorage();
  const replaced = [];
  return {
    storage,
    replaced,
    args: {
      href: `${BASE}?userCode=ABC123&corpId=6`,
      hasToken: false,
      corpId: "6",
      exchange: async () => ({
        access_token: "tok",
        refresh_token: "ref",
        client_id: "app"
      }),
      fetchMe: async () => ({
        id: "188015",
        name: "李权泓",
        corpUsers: [{ corpId: "6", id: "900" }]
      }),
      setToken: () => {},
      setClientType: () => {},
      storage,
      replaceUrl: (url) => replaced.push(url),
      ...over.args
    }
  };
};

test("readUserCode 只取 userCode，坏 URL 返回空串", () => {
  assert.equal(readUserCode(`${BASE}?userCode=ABC&corpId=6`), "ABC");
  assert.equal(readUserCode(`${BASE}?corpId=6`), "");
  assert.equal(readUserCode("不是 URL"), "");
});

test("stripUserCode 只摘 userCode，其余参数原样留着", () => {
  const out = stripUserCode(`${BASE}?userCode=ABC&corpId=6`);
  assert.equal(out.includes("userCode"), false);
  assert.equal(out.includes("corpId=6"), true);
});

test("pickCorpUserId 按 corpId 找企业内 user.id，数字与字符串都能对上", () => {
  const me = { corpUsers: [{ corpId: 6, id: 900 }] };
  assert.equal(pickCorpUserId(me, "6"), "900");
  assert.equal(pickCorpUserId(me, "7"), "");
  assert.equal(pickCorpUserId(null, "6"), "");
});

test("已有 token 时直接放行，不去换码", async () => {
  let called = false;
  const d = deps({
    args: { hasToken: true, exchange: async () => (called = true) }
  });
  const res = await bootstrapUserCodeAuth(d.args);
  assert.deepEqual(res, { ok: true, via: "token" });
  assert.equal(called, false);
});

test("没有 userCode 时不动任何东西", async () => {
  const d = deps({ args: { href: `${BASE}?corpId=6` } });
  const res = await bootstrapUserCodeAuth(d.args);
  assert.equal(res.ok, false);
  assert.equal(res.reason, "no-usercode");
  assert.equal(d.storage.map.size, 0);
});

test("换码成功：写 token / accountId / 企业内 userId，并把 userCode 摘掉", async () => {
  let savedToken = null;
  let clientType = "";
  const d = deps({
    args: {
      setToken: (v) => (savedToken = v),
      setClientType: (v) => (clientType = v)
    }
  });
  const res = await bootstrapUserCodeAuth(d.args);
  assert.deepEqual(res, { ok: true, via: "userCode" });
  assert.deepEqual(savedToken, { access_token: "tok", refresh_token: "ref" });
  assert.equal(clientType, "app");
  assert.equal(d.storage.getItem("zxAccountId"), "188015");
  assert.equal(d.storage.getItem("meetingUserId"), "900");
  assert.equal(d.storage.getItem("meetingUserName"), "李权泓");
  assert.equal(d.replaced.length, 1);
  assert.equal(d.replaced[0].includes("userCode"), false);
});

test("me 里没有当前企业时，meetingUserId 先兜底成 accountId", async () => {
  const d = deps({
    args: {
      fetchMe: async () => ({
        id: "188015",
        corpUsers: [{ corpId: "9", id: "1" }]
      })
    }
  });
  await bootstrapUserCodeAuth(d.args);
  assert.equal(d.storage.getItem("meetingUserId"), "188015");
});

test("换码接口报错 / 回参没 access_token 时不写任何身份", async () => {
  const boom = deps({
    args: {
      exchange: async () => {
        throw new Error("400");
      }
    }
  });
  assert.equal(
    (await bootstrapUserCodeAuth(boom.args)).reason,
    "exchange-error"
  );
  assert.equal(boom.storage.map.size, 0);

  const empty = deps({ args: { exchange: async () => ({}) } });
  assert.equal(
    (await bootstrapUserCodeAuth(empty.args)).reason,
    "exchange-failed"
  );
  assert.equal(empty.storage.map.size, 0);
});

test("get_my_info 失败时不写身份，地址栏的 userCode 也不摘", async () => {
  const d = deps({
    args: {
      fetchMe: async () => {
        throw new Error("500");
      }
    }
  });
  const res = await bootstrapUserCodeAuth(d.args);
  assert.equal(res.reason, "me-error");
  assert.equal(d.storage.map.size, 0);
  assert.equal(d.replaced.length, 0);
});
