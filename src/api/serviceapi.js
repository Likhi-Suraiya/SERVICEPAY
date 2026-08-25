// src/api/serviceapi.js — BLIL Service history CRUD (fetch-based, same pattern as ownerapi)
import { API_BASE_URL, AUTH_USERNAME, AUTH_PASSWORD } from "./baseurl";

const HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization:
    "Basic " +
    btoa(
      `${AUTH_USERNAME}:${AUTH_PASSWORD}`
    ),
  S_KEYL: import.meta.env.VITE_S_KEYL,
};

const handle = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.successMessage || `Request failed (${res.status})`);
  }
  return body;
};

export const getServices = async () => {
  const body = await handle(
    await fetch(`${API_BASE_URL}/BlilService/All`, { headers: HEADERS })
  );
  return body.data ?? [];
};

// Complete servicing history of one customer
export const getServicesByCustomer = async (customerId) => {
  const body = await handle(
    await fetch(
      `${API_BASE_URL}/BlilService/ByCustomer/${encodeURIComponent(customerId)}`,
      { headers: HEADERS }
    )
  );
  return body.data ?? [];
};

export const insertService = async (service, actionBy) => {
  return handle(
    await fetch(`${API_BASE_URL}/BlilService/Insert`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ ...service, actionBy }),
    })
  );
};

export const updateService = async (service, actionBy) => {
  return handle(
    await fetch(`${API_BASE_URL}/BlilService/Update`, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({ ...service, actionBy }),
    })
  );
};

export const deleteService = async (serviceId, actionBy) => {
  return handle(
    await fetch(
      `${API_BASE_URL}/BlilService/Delete/${serviceId}` +
        (actionBy ? `?actionBy=${encodeURIComponent(actionBy)}` : ""),
      { method: "DELETE", headers: HEADERS }
    )
  );
};