// src/api/ownerdocapi.js — agreement copy upload/list/download/delete
import { API_BASE_URL, AUTH_USERNAME, AUTH_PASSWORD } from "./baseurl";

const AUTH = "Basic " + btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`);

const JSON_HEADERS = {
  Accept: "application/json",
  Authorization: AUTH,
  S_KEYL: import.meta.env.VITE_S_KEYL,
};

const handle = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.successMessage || `Request failed (${res.status})`);
  return body;
};

// Upload agreement copy (PDF/JPG/PNG, max 10 MB).
// NOTE: no Content-Type header — the browser sets the multipart boundary.
export const uploadOwnerDoc = async (customerId, file, actionBy) => {
  const fd = new FormData();
  fd.append("customerId", customerId);
  fd.append("actionBy", actionBy || "");
  fd.append("file", file);
  return handle(
    await fetch(`${API_BASE_URL}/BlilOwnerDoc/Upload`, {
      method: "POST",
      headers: {
        Authorization: AUTH,
        S_KEYL: import.meta.env.VITE_S_KEYL,
      },
      body: fd,
    })
  );
};

export const getOwnerDocs = async (customerId) => {
  const body = await handle(
    await fetch(
      `${API_BASE_URL}/BlilOwnerDoc/ByCustomer/${encodeURIComponent(customerId)}`,
      { headers: JSON_HEADERS }
    )
  );
  return body.data ?? [];
};

// View in a new browser tab (PDF/images preview natively)
export const viewOwnerDoc = async (docId) => {
  const res = await fetch(`${API_BASE_URL}/BlilOwnerDoc/Download/${docId}`, {
    headers: {
      Authorization: AUTH,
      S_KEYL: import.meta.env.VITE_S_KEYL,
    },
  });
  if (!res.ok) throw new Error(`View failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

// Download via fetch (auth headers required), then trigger the browser save
export const downloadOwnerDoc = async (docId, fileName) => {
  const res = await fetch(`${API_BASE_URL}/BlilOwnerDoc/Download/${docId}`, {
    headers: {
      Authorization: AUTH,
      S_KEYL: import.meta.env.VITE_S_KEYL,
    },
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || `agreement_${docId}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const deleteOwnerDoc = async (docId, actionBy) => {
  return handle(
    await fetch(
      `${API_BASE_URL}/BlilOwnerDoc/Delete/${docId}` +
        (actionBy ? `?actionBy=${encodeURIComponent(actionBy)}` : ""),
      { method: "DELETE", headers: JSON_HEADERS }
    )
  );
};