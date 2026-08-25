// src/api/ownerapi.js — BLIL Owner CRUD (fetch-based, same pattern as lookupapi)
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

export const getOwners = async () => {
  const body = await handle(
    await fetch(`${API_BASE_URL}/BlilOwner/All`, { headers: HEADERS })
  );
  return body.data ?? [];
};

export const insertOwner = async (owner, actionBy) => {
  return handle(
    await fetch(`${API_BASE_URL}/BlilOwner/Insert`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ ...owner, actionBy }),
    })
  );
};

export const updateOwner = async (owner, actionBy) => {
  return handle(
    await fetch(`${API_BASE_URL}/BlilOwner/Update`, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({ ...owner, actionBy }),
    })
  );
};

export const deleteOwner = async (customerId, actionBy) => {
  return handle(
    await fetch(
      `${API_BASE_URL}/BlilOwner/Delete/${encodeURIComponent(customerId)}` +
        (actionBy ? `?actionBy=${encodeURIComponent(actionBy)}` : ""),
      { method: "DELETE", headers: HEADERS }
    )
  );
};

export const getOwnerAssets = async (customerId) => {
  const body = await handle(
    await fetch(
      `${API_BASE_URL}/BlilOwner/Assets/${encodeURIComponent(customerId)}`,
      { headers: HEADERS }
    )
  );
  return body.data ?? [];
};

// All active assets for all customers (list page + Excel export)
export const getAllAssets = async () => {
  const body = await handle(
    await fetch(`${API_BASE_URL}/BlilOwner/AllAssets`, { headers: HEADERS })
  );
  return body.data ?? [];
};