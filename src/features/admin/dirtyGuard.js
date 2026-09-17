export const formSnapshot = (form) => JSON.stringify(form);

export const isFormDirty = (form, snapshot) =>
  JSON.stringify(form) !== snapshot;

/** 脏且未在提交中才拦离开 */
export const shouldBlockLeave = ({ dirty, submitting = false }) =>
  Boolean(dirty) && !submitting;
