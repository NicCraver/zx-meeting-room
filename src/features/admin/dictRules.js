export const dictNameError = ({ name, items = [], type, editingId } = {}) => {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "请输入名称";
  if (trimmed.length > 20) return "名称不超过 20 个字";
  const dup = items.find(
    (item) => item.type === type && item.name === trimmed && item.id !== editingId
  );
  if (dup) return "同类型下已有相同名称";
  return "";
};

export const dictDeleteBlockedMessage = (item) => {
  const used = item?.usageCount || 0;
  if (used > 0) return `有 ${used} 间会议室正在使用「${item.name}」，无法删除`;
  return "";
};
