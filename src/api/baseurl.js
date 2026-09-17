// src/api/baseurl.js
// All API calls go through /api — the proxy (Vite dev or IIS web.config) handles routing.

export const API_BASE_URL = "/api";

export const VITE_S_KEYL = import.meta.env.VITE_S_KEYL || "RxsJ4LQdkVFTv37rYfW9b6";
export const AUTH_USERNAME = import.meta.env.VITE_BASIC_USER || "auth";
export const AUTH_PASSWORD = import.meta.env.VITE_BASIC_PASS || "12Pran@123456$";
