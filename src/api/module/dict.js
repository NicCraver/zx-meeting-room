import http from "../http";

export const listDicts = (type) =>
  http.get("/dicts", { params: type ? { type } : {} });

export const createDict = (payload) => http.post("/dicts/create", payload);

export const updateDict = (id, payload) =>
  http.post(`/dicts/update/${id}`, payload);

export const setDictEnabled = (id, enabled) =>
  http.post(`/dicts/enabled/${id}`, { enabled });

export const deleteDict = (id) => http.post(`/dicts/delete/${id}`);
