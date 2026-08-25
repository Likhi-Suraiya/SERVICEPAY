// src/api/spareapi.js — spare parts type-ahead search
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

export const searchSpareItems = async (q, max = 15) => {
  if (!q || q.trim().length < 2) return [];
  const res = await fetch(
    `${API_BASE_URL}/BlilSpare/Search?q=${encodeURIComponent(q.trim())}&max=${max}`,
    { headers: HEADERS }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.successMessage || "Search failed");
  return body.data ?? [];
};

const handle = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.successMessage || `Request failed (${res.status})`);
  return body;
};


export const getSpareItems = async () => {
  const body = await handle(
    await fetch(`${API_BASE_URL}/BlilSpare/All`, { headers: HEADERS })
  );
  return body.data ?? [];
};

export const insertSpareItem = async (item, actionBy) => {
  return handle(
    await fetch(`${API_BASE_URL}/BlilSpare/Insert`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ ...item, actionBy }),
    })
  );
};

export const updateSpareItem = async (item, actionBy) => {
  return handle(
    await fetch(`${API_BASE_URL}/BlilSpare/Update`, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({ ...item, actionBy }),
    })
  );
};

export const deleteSpareItem = async (itemId, actionBy) => {
  return handle(
    await fetch(
      `${API_BASE_URL}/BlilSpare/Delete/${itemId}` +
        (actionBy ? `?actionBy=${encodeURIComponent(actionBy)}` : ""),
      { method: "DELETE", headers: HEADERS }
    )
  );
};