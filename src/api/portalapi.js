// src/api/portalapi.js — customer portal (partner login + self-service)
import { API_BASE_URL, AUTH_USERNAME, AUTH_PASSWORD } from "./baseurl";

const baseHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization:
    "Basic " +
    btoa(
      `${AUTH_USERNAME}:${AUTH_PASSWORD}`
    ),
  S_KEYL: import.meta.env.VITE_S_KEYL,
});

const tokenHeaders = () => ({
  ...baseHeaders(),
  P_TOKEN: getPortalUser()?.token || "",
});

const handle = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && body.successMessage?.includes("Session")) {
      clearPortalUser();
      window.location.href = "/portal/login";
    }
    throw new Error(body.successMessage || `Request failed (${res.status})`);
  }
  return body;
};

// ---- session helpers (kept separate from staff auth) ----
export const getPortalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("portalUser") || "null");
  } catch {
    return null;
  }
};
export const setPortalUser = (u) =>
  localStorage.setItem("portalUser", JSON.stringify(u));
export const clearPortalUser = () => localStorage.removeItem("portalUser");

// ---- auth ----
export const portalLogin = async (userId, password) => {
  const body = await handle(
    await fetch(`${API_BASE_URL}/BlilPortal/Login`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ userId, password }),
    })
  );
  return body.data;
};

export const portalChangePassword = async (oldPassword, newPassword) =>
  handle(
    await fetch(`${API_BASE_URL}/BlilPortal/ChangePassword`, {
      method: "POST",
      headers: tokenHeaders(),
      body: JSON.stringify({ oldPassword, newPassword }),
    })
  );

// ---- data ----
export const getPortalSummary = async () =>
  (await handle(
    await fetch(`${API_BASE_URL}/BlilPortal/Summary`, { headers: tokenHeaders() })
  )).data;

export const getPortalHistory = async () =>
  (await handle(
    await fetch(`${API_BASE_URL}/BlilPortal/History`, { headers: tokenHeaders() })
  )).data ?? [];

export const getPortalPayments = async () =>
  (await handle(
    await fetch(`${API_BASE_URL}/BlilPortal/Payments`, { headers: tokenHeaders() })
  )).data ?? [];

export const getMyRequests = async () =>
  (await handle(
    await fetch(`${API_BASE_URL}/BlilPortal/Requests`, { headers: tokenHeaders() })
  )).data ?? [];

export const createServiceRequest = async (request) =>
  handle(
    await fetch(`${API_BASE_URL}/BlilPortal/Request`, {
      method: "POST",
      headers: tokenHeaders(),
      body: JSON.stringify(request),
    })
  );

// ---- staff side ----
export const getStaffRequests = async (status) =>
  (await handle(
    await fetch(
      `${API_BASE_URL}/BlilPortal/StaffRequests${status ? `?status=${status}` : ""}`,
      { headers: baseHeaders() }
    )
  )).data ?? [];

export const setRequestStatus = async (id, status, remark, actionBy) =>
  handle(
    await fetch(
      `${API_BASE_URL}/BlilPortal/RequestStatus/${id}?status=${encodeURIComponent(status)}` +
        `&remark=${encodeURIComponent(remark || "")}&actionBy=${encodeURIComponent(actionBy || "")}`,
      { method: "PUT", headers: baseHeaders() }
    )
  );