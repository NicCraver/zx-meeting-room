export const RACE_CHANNEL = "meeting-race";

export const classifyRacePair = (results = {}) => {
  const a = results.A;
  const b = results.B;
  if (!a || !b) {
    return { verdict: "incomplete", label: "还没收齐两边结果" };
  }
  const list = [a, b];
  const oks = list.filter((r) => r.ok);
  const occupied = list.filter((r) => r.code === "M4010");
  if (oks.length === 1 && occupied.length === 1) {
    return {
      verdict: "serialized",
      label: "锁生效：一人成功，另一人「该时段已被占用」"
    };
  }
  if (oks.length === 2) {
    return {
      verdict: "overlap",
      label: "双双成功，并发没拦住，看板会出现重叠占用"
    };
  }
  const codes = list.map((r) => r.code || (r.ok ? "M0000" : "ERR")).join(" / ");
  return { verdict: "other", label: `未预期：${codes}` };
};
