export const roomNameError = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "请输入名称";
  if (trimmed.length > 30) return "名称不超过 30 个字";
  return "";
};

export const locationDescError = (value) => {
  if (String(value || "").trim().length > 50) return "位置描述不超过 50 个字";
  return "";
};

export const capacityError = (value) => {
  const cap = Number(value);
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isInteger(cap) ||
    cap < 1 ||
    cap > 999
  ) {
    return "请输入容纳人数（1-999整数）";
  }
  return "";
};

export const openHoursError = (openStart, openEnd) => {
  if (!openStart || !openEnd) return "请选择开放时间";
  if (openEnd <= openStart) return "结束时间必须晚于开始时间";
  return "";
};
