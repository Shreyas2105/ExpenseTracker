import axios from "axios";

const API = axios.create({ baseURL: "/api" });


API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ---- Auth ----
export const signup = (data) => API.post("/auth/signup", data);
export const login = (data) => API.post("/auth/login", data);

// ---- Transactions ----
export const getTransactions = () => API.get("/transactions");
export const addTransaction = (data) => API.post("/transactions", data);
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);
export const getMonthlySummary = (month, year) =>
  API.get(`/transactions/summary?month=${month}&year=${year}`);