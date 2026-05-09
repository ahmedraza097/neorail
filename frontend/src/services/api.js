import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (user?._id) {
    config.headers["x-user-id"] = user._id;
  }
  return config;
});

// AUTH
export const registerUser = (data) => api.post("/users/register", data);
export const loginUser = (data) => api.post("/users/login", data);

// TRAINS
export const getAllTrains = () => api.get("/trains");
export const getTrainById = (id) => api.get(`/trains/${id}`);
export const searchTrains = (from, to) =>
  api.get("/trains/search", { params: { from, to } });

// TICKETS
export const bookTicket = (user_id, train_id) =>
  api.post("/tickets/book", { user_id, train_id });
export const getUserTickets = (userId) =>
  api.get(`/tickets/user/${userId}`);
export const confirmSeat = (user_id, train_id) =>
  api.post("/tickets/confirm-seat", { user_id, train_id });

export default api;
