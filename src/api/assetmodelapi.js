// src/api/assetmodelapi.js — lift/generator model list CRUD (fetch-based)
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

// All models incl. inactive (management page)
export const getAssetModelsAll = async () => {
  const body = await handle(
    await fetch(`${API_BASE_URL}/BlilAssetModel/All`, { headers: HEADERS })
  );
  return body.data ?? [];
};

export const insertAssetModel = async (model, actionBy) =>
  handle(
    await fetch(`${API_BASE_URL}/BlilAssetModel/Insert`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ ...model, actionBy }),
    })
  );

export const updateAssetModel = async (model, actionBy) =>
  handle(
    await fetch(`${API_BASE_URL}/BlilAssetModel/Update`, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({ ...model, actionBy }),
    })
  );

export const deleteAssetModel = async (modelId, actionBy) =>
  handle(
    await fetch(
      `${API_BASE_URL}/BlilAssetModel/Delete/${modelId}` +
        (actionBy ? `?actionBy=${encodeURIComponent(actionBy)}` : ""),
      { method: "DELETE", headers: HEADERS }
    )
  );

export const activateAssetModel = async (modelId, actionBy) =>
  handle(
    await fetch(
      `${API_BASE_URL}/BlilAssetModel/Activate/${modelId}` +
        (actionBy ? `?actionBy=${encodeURIComponent(actionBy)}` : ""),
      { method: "PUT", headers: HEADERS }
    )
  );