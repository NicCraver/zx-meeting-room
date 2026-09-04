import http from "../http";

export const getBoard = (date) => http.get("/board", { params: { date } });

export const listMyBookings = () => http.get("/bookings/mine");

export const createBooking = (payload) => http.post("/bookings/create", payload);

export const updateBooking = (id, payload) =>
  http.post(`/bookings/update/${id}`, payload);

export const releaseBooking = (id) => http.post(`/bookings/release/${id}`);

export const listBookingAudit = (id) => http.get(`/bookings/audit/${id}`);

export const listAdminBookings = (params) =>
  http.get("/bookings/admin", { params });
